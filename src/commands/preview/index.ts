import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokensFromText } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { loadBlacklist } from '@security/loaders';
import { updateSymlink } from '@utils/symlink-utils';
import crypto from 'crypto';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, printLabeledBox, paddedSubCompact } from '@utils/cli/ui';
// import { printLabeledBox } from '@utils/cli/box'; // adjust import path if needed
import chalk from 'chalk';
import ora from 'ora';
import { slowPrint } from '@utils/cli/slowPrint';
import { console } from 'inspector';

export async function runPreviewCommand(): Promise<void> {
  let DOKUGENT_CLI_VERSION = '0.0.0';
  let DOKUGENT_SCHEMA_VERSION = '0.0';
  let DOKUGENT_CREATED_VIA = 'unknown';

  try {
    const schemaConstants = await import('@constants/schema');
    DOKUGENT_CLI_VERSION = schemaConstants.DOKUGENT_CLI_VERSION ?? DOKUGENT_CLI_VERSION;
    DOKUGENT_SCHEMA_VERSION = schemaConstants.DOKUGENT_SCHEMA_VERSION ?? DOKUGENT_SCHEMA_VERSION;
    DOKUGENT_CREATED_VIA = schemaConstants.DOKUGENT_CREATED_VIA ?? DOKUGENT_CREATED_VIA;
  } catch (e) {
    console.warn('⚠️  Could not load schema constants, using fallback values.');
  }
  function ensureTimestampsAndTokens(obj: any, now: Date): void {
    // This logic uses token count as a lightweight tamper signal.
    // If the estimatedTokens value differs from the saved version,
    // we assume the file was modified after its initial creation.
    // We then update lastModifiedAt to now. This is not a cryptographic
    // hash, but a practical checksum until stricter integrity features
    // like file hashing or version locking are introduced.
    if (!obj.createdAt) obj.createdAt = now.toISOString();
    if (!obj.createdAtDisplay) obj.createdAtDisplay = now.toLocaleString();

    const estimatedToken = estimateTokensFromText(JSON.stringify(obj, null, 2));

    if (typeof obj.estimatedTokens !== 'number' || obj.estimatedTokens !== estimatedToken) {
      obj.lastModifiedAt = now.toISOString();
      obj.lastModifiedAtDisplay = now.toLocaleString();
      obj.estimatedTokens = estimatedToken;
    } else {
      obj.lastModifiedAt ??= obj.createdAt;
      obj.lastModifiedAtDisplay ??= obj.createdAtDisplay;
    }
  }
  const base = '.dokugent/data';

  // Resolve agent
  const agentCurrent = path.join(base, 'agents', 'current');
  const agentLatest = path.join(base, 'agents', 'latest');
  const agentDir = (await fs.pathExists(agentCurrent)) ? agentCurrent : agentLatest;
  //.dokugent/data/agents/current/identity.json
  const agentMetaPath = path.join(agentDir, 'identity.json');

  // Resolve plan
  const planDir = (await fs.pathExists(path.join(base, 'plans', 'current')))
    ? path.join(base, 'plans', 'current')
    : path.join(base, 'plans', 'latest');
  const planPath = path.join(planDir, 'plan.json');

  // Resolve conventions (defaulting to dev)
  //.dokugent/data/conventions/dev/latest/
  const conventionsDir = path.join(base, 'conventions', 'dev', 'latest');
  // TODO: Handle multiple convention types
  const conventionsMetaPath = path.join(conventionsDir, 'conventions.meta.json');

  // Resolve previewer (multi-previewer strategy)
  const previewerDir = path.join('.dokugent/keys', 'signers');
  const previewers = (await fs.readdir(previewerDir)).filter(name => !name.startsWith('.'));
  if (previewers.length === 0) {
    paddedLog(`${glyphs.cross} No Key Found`, 'No previewers found in .dokugent/keys/signers', PAD_WIDTH, 'warn', 'WARNING');
    paddedLog(`${glyphs.info} Create key`, `Run 'dokugent keygen' to create a preview identity key before proceeding`, PAD_WIDTH, 'blue', 'HELP');
    console.log();
    return;
  }

  let selectedPreviewer = previewers[0];
  console.log()
  if (previewers.length > 1) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: '❓ Who should be used as signing previewer identity?',
        choices: previewers,
      },
    ]);
    selectedPreviewer = selected;
  }

  const previewerJsonFile = `${selectedPreviewer}.meta.json`;
  const previewerLatestDir = path.join(previewerDir, selectedPreviewer, 'latest');
  const previewerPath = path.join(previewerLatestDir, previewerJsonFile);

  const previewerExists = await fs.pathExists(previewerPath);
  if (!previewerExists) {
    throw new Error(`❌ Expected previewer file '${previewerJsonFile}' not found in .dokugent/keys/signers/${selectedPreviewer}/latest`);
  }

  // Resolve owner selection
  const ownerDirs = (await fs.readdir(path.join('.dokugent', 'data', 'owners'))).filter(name => !name.startsWith('.'));
  if (ownerDirs.length === 0) {
    paddedLog(`${glyphs.cross} No Owner Found`, 'No owner identities found in .dokugent/data/owners', PAD_WIDTH, 'warn', 'WARNING');
    paddedLog(`${glyphs.info} Create owner`, `Run 'dokugent owner' to create an owner identity before proceeding`, PAD_WIDTH, 'blue', 'HELP');
    console.log();
    return;
  }
  let selectedOwner = ownerDirs[0];
  if (ownerDirs.length > 1) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: '❓ Who should be used as owner identity?',
        choices: ownerDirs,
      },
    ]);
    selectedOwner = selected;
  }

  // Resolve owner path from .dokugent/data/owners
  const ownersDataDir = path.join('.dokugent', 'data', 'owners');
  const ownerJsonFile = `owner.${selectedOwner}.json`;
  const ownerPath = path.join(ownersDataDir, selectedOwner, ownerJsonFile);
  const ownerExists = await fs.pathExists(ownerPath);
  if (!ownerExists) {
    throw new Error(`❌ Expected owner file '${ownerJsonFile}' not found in .dokugent/data/owners/${selectedOwner}`);
  }

  let conventionsRaw: any = {
    conventions: [],
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA
  };

  const [agent, planJson, owner, previewer] = await Promise.all([
    fs.readJson(agentMetaPath),
    fs.readJson(planPath),
    fs.readJson(ownerPath),
    fs.readJson(previewerPath),
  ]);

  // Validate plan steps input/output files and security flags
  // Support --doctor and --fix mode for mock validation
  const isDoctorMode = process.argv.includes('--doctor');
  const isFixMode = process.argv.includes('--fix');
  const mockErrors: string[] = [];
  let hasPlanChanged = false;
  if (Array.isArray(planJson.steps)) {
    for (const step of planJson.steps) {
      // Compute correct input/output paths
      const correctInput = `mocks/custom-tool/${step.id}-input.md`;
      const correctOutput = `mocks/custom-tool/${step.id}-output.md`;
      const inputPath = path.join(base, correctInput);
      const outputPath = path.join(base, correctOutput);
      const inputExists = await fs.pathExists(inputPath);
      const outputExists = await fs.pathExists(outputPath);

      // Auto-create missing files if --fix is enabled
      if (!inputExists && isFixMode) {
        await fs.outputFile(inputPath, `<!-- TODO: Fill input for step ${step.id} -->\n`);
      }
      if (!outputExists && isFixMode) {
        await fs.outputFile(outputPath, `<!-- TODO: Fill output for step ${step.id} -->\n`);
      }

      // Check if step.input/output are correct, and fix if needed
      const inputMismatch = step.input !== correctInput;
      const outputMismatch = step.output !== correctOutput;
      if ((inputMismatch || outputMismatch) && isFixMode) {
        step.input = correctInput;
        step.output = correctOutput;
        hasPlanChanged = true;
      }

      // Re-check if files exist after fix attempt
      const finalInputExists = await fs.pathExists(inputPath);
      const finalOutputExists = await fs.pathExists(outputPath);
      if (!finalInputExists || !finalOutputExists) {
        const msg = `${glyphs.cross} Mock file validation failed for step "${step.id}".\n→ Expected: ${correctInput}, ${correctOutput}`;
        if (isDoctorMode) {
          mockErrors.push(msg);
          continue;
        } else {
          throw new Error(msg);
        }
      }
      // Security warnings
      // [DEBUG] Log step.security before checking
      console.log('[DEBUG] Step Security:', step.security);
      // Fallback if security field is missing
      step.security = step.security || {};
      if (step.security) {
        if (step.security.riskLevel === "High") {
          console.warn(`⚠️  High risk step "${step.id}" flagged with: riskLevel`);
        }
        if (Array.isArray(step.security.trifecta) && step.security.trifecta.length > 0) {
          console.warn(`⚠️  High risk step "${step.id}" flagged with: ${step.security.trifecta.join(', ')}`);
        }
      }
    }
    // After the loop, if doctor mode and issues, print them and return
    if (isDoctorMode && mockErrors.length > 0) {
      console.log();
      paddedLog(`${glyphs.cross} Mock Validation Issues`, '', PAD_WIDTH, 'warn', 'WARNING');
      for (const err of mockErrors) {
        paddedSub('', err);
      }
      paddedLog(`${glyphs.info} Suggestion`, `Fix the above issues or run with 'dokugent preview --doctor --fix' for auto-correction.`, PAD_WIDTH, 'blue', 'HELP');
      console.log();
      return;
    }
    // --- Early return after --fix if plan changed ---
    if (isFixMode && hasPlanChanged) {
      await fs.writeJson(planPath, planJson, { spaces: 2 });
      paddedLog('Plan file updated', `Corrected mock paths saved to ${planPath}`, PAD_WIDTH, 'success', 'FIXED');
      paddedLog(`${glyphs.check} Fix Applied`, `Please review the generated mock files before rerunning preview.`, PAD_WIDTH, 'info', 'NOTICE');
      return;
    }
  }

  // Load conventions.meta.json
  if (await fs.pathExists(conventionsMetaPath)) {
    const meta = await fs.readJson(conventionsMetaPath);
    // Only include its individual convention entries, not the meta wrapper
    conventionsRaw = {
      conventions: [],
      cliVersion: meta.cliVersion,
      schemaVersion: meta.schemaVersion,
      createdVia: meta.createdVia
    };
    if (meta.conventions && Array.isArray(meta.conventions)) {
      for (const entry of meta.conventions) {
        if (entry.file === 'conventions.meta.json') continue; // Skip metadata file
        conventionsRaw.conventions.push({
          llmName: entry.llmName,
          file: entry.file,
          content: entry.content || {}
        });
      }
    }
  } else {
    paddedLog(`${glyphs.cross} No Conventions Found`, 'No conventions found in .dokugent/data/conventions/dev/latest', PAD_WIDTH, 'warn', 'WARNING');
    paddedLog(`${glyphs.info} Optional`, `If you'd like to define conventions for your agent, run 'dokugent conventions'`, PAD_WIDTH, 'blue', 'HELP');
    console.log();
  }
  // Inject correct previewer name from folder context
  previewer.previewerName = selectedPreviewer;

  // --- Source Version Metadata Extraction and Cleanup ---
  const sourceVersions: any = {
    agent: {
      cliVersion: agent.cliVersion,
      schemaVersion: agent.schemaVersion,
      createdVia: agent.createdVia
    },
    plan: {
      cliVersion: planJson.cliVersion,
      schemaVersion: planJson.schemaVersion,
      createdVia: planJson.createdVia
    },
    criteria: undefined, // will be populated later if criteria exists
    conventions: {
      cliVersion: conventionsRaw.cliVersion,
      schemaVersion: conventionsRaw.schemaVersion,
      createdVia: conventionsRaw.createdVia
    },
    owner: {
      cliVersion: owner.cliVersion,
      schemaVersion: owner.schemaVersion,
      createdVia: owner.createdVia
    },
    byo: undefined // will populate below if exists
  };

  // Clean up versioning metadata from sub-objects
  delete agent.cliVersion;
  delete agent.schemaVersion;
  delete agent.createdVia;

  delete planJson.cliVersion;
  delete planJson.schemaVersion;
  delete planJson.createdVia;

  delete conventionsRaw.cliVersion;
  delete conventionsRaw.schemaVersion;
  delete conventionsRaw.createdVia;

  delete owner.cliVersion;
  delete owner.schemaVersion;
  delete owner.createdVia;

  function convertMarkdownToJSON(markdown: string): Record<string, any> {
    const lines = markdown.split('\n');
    const result: Record<string, any> = {};
    const stack: { level: number; key: string; obj: any }[] = [];
    let currentObj = result;
    let lastKey = '';

    for (const line of lines) {
      const headingMatch = line.match(/^(#+)\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const key = headingMatch[2].trim();
        const newObj: any = {};
        if (level === 1) continue; // Skip top-level title

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          result[key] = newObj;
          currentObj = newObj;
          stack.push({ level, key, obj: newObj });
        } else {
          const parent = stack[stack.length - 1].obj;
          parent[key] = newObj;
          currentObj = newObj;
          stack.push({ level, key, obj: newObj });
        }

        lastKey = key;
      } else if (line.trim().startsWith('- ')) {
        const item = line.trim().substring(2).trim();
        if (!Array.isArray(currentObj[lastKey])) {
          currentObj[lastKey] = [];
        }
        currentObj[lastKey].push(item);
      } else if (line.trim()) {
        // Standalone paragraph, assign as value
        currentObj[lastKey] = line.trim();
      }
    }

    return result;
  }

  for (const item of conventionsRaw.conventions) {
    // Skip if item.file is 'conventions.meta.json' (do not re-add the meta wrapper)
    if (item.file === 'conventions.meta.json') continue;
    const filePath = path.join(conventionsDir, item.file);
    if (item.file.endsWith('.json')) {
      item.content = await fs.readJson(filePath);
    } else {
      const markdown = await fs.readFile(filePath, 'utf-8');
      item.content = convertMarkdownToJSON(markdown);
    }
  }

  // Remove any hardcoded deepseek.json and qwen.json entries if already present from metadata
  // (This is now handled by only including meta.conventions entries above)
  const conventions = conventionsRaw;

  const now = new Date();


  const previewerData = {
    previewerName: previewer.previewerName,
    previewedAt: now.toISOString(),
    previewedAtDisplay: now.toLocaleString(),
    email: previewer.email,
    publicKey: previewer.publicKey,
    fingerprint: previewer.fingerprint ?? crypto.createHash('sha256').update(previewer.publicKey).digest('hex'),
    previewKeyVersion: path.basename(path.dirname(previewerPath)),
    trustLevel: previewer.trustLevel ?? 'unverified'
  };

  const certObject: any = {
    agent,
    plan: planJson,
    criteria: undefined,
    conventions: conventions,
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    sourceVersions, // <- add here
    // owner and previewer will be added below
  };

  ensureTimestampsAndTokens(planJson, now);
  // Only call if criteria is defined
  if (certObject.criteria) {
    ensureTimestampsAndTokens(certObject.criteria, now);
  }
  // After assigning certObject.criteria, update sourceVersions if criteria exists
  if (certObject.criteria) {
    sourceVersions.criteria = {
      cliVersion: certObject.criteria.cliVersion,
      schemaVersion: certObject.criteria.schemaVersion,
      createdVia: certObject.criteria.createdVia
    };

    delete certObject.criteria.cliVersion;
    delete certObject.criteria.schemaVersion;
    delete certObject.criteria.createdVia;
  }
  ensureTimestampsAndTokens(conventions, now);
  // Load optional BYO file (moved here)
  const byoDir = path.join(base, 'byo', 'processed', planJson.agentId);
  const byoPath = path.join(byoDir, 'byo.json');
  const byoExists = await fs.pathExists(byoPath);
  if (byoExists) {
    const byo = await fs.readJson(byoPath);
    sourceVersions.byo = {
      cliVersion: byo.cliVersion,
      schemaVersion: byo.schemaVersion,
      createdVia: byo.createdVia
    };
    delete byo.cliVersion;
    delete byo.schemaVersion;
    delete byo.createdVia;
    certObject.byo = byo;
  }
  certObject.owner = owner;
  certObject.previewer = previewerData;

  // Load and parse criteria
  const criteriaDir = (await fs.pathExists(path.join(base, 'criteria', 'current')))
    ? path.join(base, 'criteria', 'current')
    : path.join(base, 'criteria', 'latest');
  const criteriaPath = path.join(criteriaDir, 'criteria.json');
  const criteriaExists = await fs.pathExists(criteriaPath);
  if (criteriaExists) {
    try {
      certObject.criteria = await fs.readJson(criteriaPath);
    } catch {
      certObject.criteria = { error: 'Invalid or empty criteria.json at current/latest' };
    }
  } else {
    certObject.criteria = { error: 'criteria.json not found in current/latest' };
  }

  // (Mock validation and --fix/--doctor logic moved above certObject construction)

  // Count tokens in the certificate object
  // console.log(JSON.stringify(certObject, null, 2));
  const tokenSummary = estimateTokensFromText(JSON.stringify(certObject));
  const tokenCount = typeof tokenSummary === 'number' ? tokenSummary : (tokenSummary as any)?.total ?? 'N/A';

  // Optional debug token breakdown
  const breakdown = [
    ['agent', estimateTokensFromText(JSON.stringify(certObject.agent))],
    ['plan', estimateTokensFromText(JSON.stringify(certObject.plan))],
    ['criteria', estimateTokensFromText(JSON.stringify(certObject.criteria))],
    ['conventions', estimateTokensFromText(JSON.stringify(certObject.conventions))],
    ['owner', estimateTokensFromText(JSON.stringify(certObject.owner))],
    ['previewer', estimateTokensFromText(JSON.stringify(certObject.previewer))],
    ['versions', estimateTokensFromText(JSON.stringify(certObject.sourceVersions))],
  ];

  const SOFT_WARN = 4000;
  const HARD_WARN = 12000;

  // Inject estimated token count into preview object for later validation
  certObject.estimatedTokens = tokenCount;

  // Write preview JSON file with agent identity in filename
  const agentName = agent.agentName;
  const agentId = planJson.agentId;
  const previewDir = path.join('.dokugent/ops', 'previews', agentName);
  const previewFile = path.join(
    previewDir,
    `${agentName}@${agentId.split('@')[1]}_preview.json`
  );
  await fs.ensureDir(previewDir);

  // Always delete existing preview file first
  if (await fs.pathExists(previewFile)) {
    await fs.chmod(previewFile, 0o644); // ensure it's writable
    await fs.remove(previewFile);
  }

  await fs.writeJson(previewFile, certObject, { spaces: 2 });

  // Create or update symlink to latest preview
  const previewLatestPath = path.join('.dokugent/ops', 'previews', 'latest');
  try {
    await fs.remove(previewLatestPath);
  } catch { }
  await fs.symlink(path.resolve(previewDir), previewLatestPath, 'dir');

  // Run security check
  const denyList = await loadBlacklist();

  const scanPaths = [
    planDir,
    criteriaDir,
    conventionsDir,
    previewerDir,
    ownersDataDir,
    path.join(base, 'byo', 'processed')
  ];

  const securityIssues = await runSecurityCheck('preview', {
    denyList,
    requireApprovals: false,
    scanPaths
  });

  await fs.chmod(previewFile, 0o444);

  paddedLog('dokugent preview initialized...', '', PAD_WIDTH, 'info');
  console.log()
  if (securityIssues.length === 0) {
    ui.divider();
    const spinner = ora('          Scanning files...').start();
    console.log()
    paddedLog('Scanning agent directory', 'Checking for required files, validating metadata, and applying blacklist filters', PAD_WIDTH, 'blue', 'SCAN');
    paddedSub('Files scanned', scanPaths.map(p => `- ${p}`).join('\n'));
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed('          Scan complete');
    ui.divider();
  }
  paddedLog('Preview JSON Content\n', "", PAD_WIDTH, 'magenta', 'JSON');
  const certJson = JSON.stringify(certObject, null, 2);
  await slowPrint(certJson, 1);

  paddedLog('File', `${previewFile}`, PAD_WIDTH, 'success', 'SAVED');
  paddedLog('Estimated Token Usage', `${tokenCount} tokens\n`, PAD_WIDTH, 'pink', 'TOKENS');
  if (typeof tokenCount === 'number') {
    if (tokenCount > HARD_WARN) {
      paddedLog(
        `${glyphs.alert} Certified Token Total: ${tokenCount}`,
        `${glyphs.alert} Token count exceeds typical model limits and may fail on cert or inference.`,
        PAD_WIDTH,
        'warn',
        'WARNING'
      );
    } else if (tokenCount > SOFT_WARN) {
      paddedLog(
        `${glyphs.info} Token Count Notice: ${tokenCount}`,
        'ℹ️ Consider splitting or compressing content to avoid inference/runtime issues beyond 8192 tokens.',
        PAD_WIDTH,
        'blue',
        'NOTICE'
      );
    }
  }
  console.log();
  paddedCompact('Token Breakdown', '', PAD_WIDTH, 'info');
  for (const [key, rawValue] of breakdown as [string, any][]) {
    const value = typeof rawValue === 'object' && rawValue !== null ? rawValue.total : rawValue;
    if (typeof value === 'number') {
      paddedSubCompact('', `${key}: ${value} tokens`);
    }
  }
  console.log();
  const bts = agentId.split('@')[1];
  const certHint = `${agentName}@${bts}`;
  paddedLog(`To certify agent: ${certHint} next, run`, `dokugent certify\n`, PAD_WIDTH, 'blue', 'HELP');
}
