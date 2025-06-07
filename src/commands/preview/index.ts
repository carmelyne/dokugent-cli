import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokensFromText } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { loadBlacklist } from '@security/loaders';
import { updateSymlink } from '@utils/symlink-utils';
import crypto from 'crypto';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';
import chalk from 'chalk';
import ora from 'ora';
import { slowPrint } from '@utils/cli/slowPrint';

export async function runPreviewCommand(): Promise<void> {
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

  let selectedPreviewer = previewers[0];
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

  const [agent, planJson, conventionsRaw, owner, previewer] = await Promise.all([
    fs.readJson(agentMetaPath),
    fs.readJson(planPath),
    fs.readJson(conventionsMetaPath),
    fs.readJson(ownerPath),
    fs.readJson(previewerPath),
  ]);
  // Inject correct previewer name from folder context
  previewer.previewerName = selectedPreviewer;

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
    const filePath = path.join(conventionsDir, item.file);
    const content = await fs.readFile(filePath, 'utf-8');
    item.content = convertMarkdownToJSON(content);
  }

  const conventions = conventionsRaw;

  const ownerData = {
    ownerName: owner.owner_name ?? owner.name ?? path.basename(path.dirname(ownerPath)),
    email: owner.email,
    trustLevel: owner.trustLevel,
    organization: owner.organization,
    createdAt: owner.createdAt
  };

  const previewerData = {
    previewerName: previewer.previewerName,
    email: previewer.email,
    publicKey: previewer.publicKey,
    fingerprint: previewer.fingerprint ?? crypto.createHash('sha256').update(previewer.publicKey).digest('hex'),
    previewKeyVersion: path.basename(path.dirname(previewerPath))
  };

  const certObject: any = {
    agent,
    plan: planJson,
    criteria: undefined,
    conventions: conventions,
    // owner and previewer will be added below
  };
  // Load optional BYO file (moved here)
  const byoDir = path.join(base, 'byo', 'processed', planJson.agentId);
  const byoPath = path.join(byoDir, 'byo.json');
  const byoExists = await fs.pathExists(byoPath);
  if (byoExists) {
    certObject.byo = await fs.readJson(byoPath);
  }
  certObject.owner = ownerData;
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

  // Count tokens in the certificate object
  // console.log(JSON.stringify(certObject, null, 2));
  const tokenSummary = estimateTokensFromText(JSON.stringify(certObject));
  const tokenCount = typeof tokenSummary === 'number' ? tokenSummary : (tokenSummary as any)?.total ?? 'N/A';

  // paddedLog('🧠 Estimated Token Usage', `${tokenCount} tokens`);

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
  // paddedSub('', JSON.stringify(certObject, null, 2));
  const certJson = JSON.stringify(certObject, null, 2);
  await slowPrint(certJson, 1); // you can tweak the delay
  // paddedSub('', certJson);
  console.log()
  paddedLog('File', `${previewFile}`, PAD_WIDTH, 'success', 'SAVED');
  paddedLog('Estimated Token Usage', `${tokenCount} tokens\n`, PAD_WIDTH, 'pink', 'TOKENS');
  const bts = agentId.split('@')[1];
  const certHint = `${agentName}@${bts}`;
  paddedLog(`To certify agent: ${certHint} next, run`, `dokugent certify`, PAD_WIDTH, 'blue', 'HELP');
  console.log()
}
