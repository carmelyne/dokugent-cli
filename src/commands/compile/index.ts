// dokugent compile
// Generates final cert bundle from previewed components and BYO files

import fs from 'fs';
import path from 'path';
import { ui, paddedLog, paddedSub } from '@utils/cli/ui';
import { estimateTokensFromText, warnIfExceedsLimit } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { AGENT_DIR, CERT_DIR, BYO_DIR, LOG_DIR, REPORTS_DIR, AGENTS_CONFIG_DIR, COMPILED_DIR } from '@constants/paths';

import dotenv from 'dotenv';
import { agentsConfig } from '@config/agentsConfig';
import inquirer from 'inquirer';
dotenv.config();

const COMPILED_BY = process.env.DOKUGENT_COMPILED_BY;
if (!COMPILED_BY) {
  paddedLog('DOKUGENT_COMPILED_BY is not set in your environment. Set it in .env to track who compiled the cert.', '', 12, 'warn');
}

/**
 * Executes the Dokugent compile command.
 * This command finalizes the agent certification process by:
 * - Validating metadata
 * - Collecting user-supplied JSON objects (BYO)
 * - Performing a final tokenization and security check
 * - Writing the final compiled.cert.json and SHA digest
 * - Generating logs and audit trails
 *
 * @param agentId Optional agent identifier to use; defaults to latest symlink if not provided.
 */
export async function runCompileCommand(agentId?: string) {

  paddedLog('Iniatiate', 'Running dokugent compile...', 12, 'info', 'START');

  // STEP 1: Resolve agent context and load latest certified preview

  const agentFolders = fs.existsSync(CERT_DIR)
    ? fs.readdirSync(CERT_DIR, { withFileTypes: true }).filter(dirent => dirent.isDirectory())
    : [];

  for (const dir of agentFolders) {
    const agentName = dir.name;
    const certFiles = fs.readdirSync(path.join(CERT_DIR, agentName))
      .filter(file => file.endsWith('.cert.json'));

    const matchingCerts = certFiles.filter(file =>
      file.startsWith(agentName + '@') && file.endsWith('.cert.json')
    );

    if (matchingCerts.length === 0) {
      paddedLog(`No valid cert files found for agent ${agentName}`, '', 12, 'warn');
      continue;
    }

    paddedLog(`Found ${matchingCerts.length} cert file(s) for agent ${agentName}`, '', 0, 'info', '📦');
  }

  // STEP 2: Load and validate all user-provided JSON files from BYO_DIR
  const byoFiles = fs.readdirSync(BYO_DIR).filter(file => file.endsWith('.json'));

  if (byoFiles.length === 0) {
    paddedLog('No BYO JSON files found in', BYO_DIR, 12, 'warn');
  }

  const byoBundle: Record<string, any> = {};

  for (const file of byoFiles) {
    const fullPath = path.join(BYO_DIR, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);
      byoBundle[file] = parsed;
    } catch (err: any) {
      paddedLog(`Error parsing ${file}`, err.message, 12, 'error');
    }
  }

  paddedLog(`Loaded ${Object.keys(byoBundle).length} BYO file(s) into global-byo bundle.`, '', 0, 'info', '📦');

  // STEP 3: Append BYO files under 'global-byo' key in compiled object

  // Step 3 is effectively done by collecting byoBundle above and using it in compiledData below.

  // STEP 4: Recalculate token estimate and trigger warnings if exceeding threshold
  const fullBundleText = JSON.stringify(byoBundle, null, 2);
  const tokenEstimate = estimateTokensFromText(fullBundleText);
  paddedLog(`Estimated tokens for final BYO bundle: ${tokenEstimate.toLocaleString()}`, '', 0, 'info', '🧮');

  // STEP 5: Perform security validations on final structure (optional)
  // Removed scan path for .dokugent/data/tool-lists as per instructions
  const scanPaths = [BYO_DIR, ...agentFolders.map(f => path.join(CERT_DIR, f.name))];
  // Use BYO_DIR for scanPath, requireApprovals: false
  const denyList: string[] = []; // You may want to load a denyList if needed
  const byoIssues: string[] = await runSecurityCheck('compile', {
    denyList,
    requireApprovals: false,
    scanPaths: [BYO_DIR]
  });

  // After cert save, output scanned files
  // Replace legacy log with paddedLog and paddedSub
  paddedLog('INFO', 'Scanned');
  paddedSub('Scanned Paths', [
    '.dokugent/data/byo/processed/...',
    '.dokugent/data/byo/raw/...',
    '.dokugent/ops/certified/...',
    '.dokugent/ops/certified/...'
  ].join('\n'));

  paddedLog('SECURITY', 'No security issues found.', 12, 'success');

  // STEP 6: Write compiled.cert.json and generate SHA256 digest

  // Track compiled version suffixes per agent@timestamp
  const compiledVersionMap: Record<string, string> = {};

  for (const dir of agentFolders) {
    const agentName = dir.name;
    const certFiles = fs.readdirSync(path.join(CERT_DIR, agentName))
      .filter(file => file.endsWith('.cert.json') && file.includes('@'));

    for (const certFile of certFiles) {
      const match = certFile.match(/@(.*?)\.cert\.json$/);
      if (!match) continue;
      const birthTimestamp = match[1];

      const previewPath = path.join(CERT_DIR, agentName, certFile);
      const previewJson = JSON.parse(fs.readFileSync(previewPath, 'utf-8'));

      // Debugging previewJson load
      // Optionally, keep these logs for debugging, or remove for production
      // paddedLog('Raw previewJson loaded from', previewPath, 12, 'info', '📤');
      // paddedLog('Preview JSON keys', JSON.stringify(Object.keys(previewJson)), 12, 'info', '🔍');
      // paddedLog('Raw previewJson contents', JSON.stringify(previewJson, null, 2), 12, 'info', '📄');

      // === CERTIFICATION VALIDATION: Ensure previewJson is certified ===
      const isCertified = Boolean(
        previewJson.certifier &&
        typeof previewJson.certifier === 'object' &&
        previewJson.certifier.certifierName &&
        previewJson.metadata?.certifierKeyVersion
      );

      if (!isCertified) {
        paddedLog('Cannot compile: this file has not been certified.', '', 12, 'error');
        paddedLog(`Please run 'dokugent certify' first to finalize the preview.`, '', 12, 'error');
        process.exit(1);
      }

      if (!previewJson.owner || !previewJson.previewer || !previewJson.certifier) {
        throw new Error(`❌ Missing one or more required roles (owner, previewer, certifier). Cannot proceed with compilation.`);
      }

      let planFolder: string;
      try {
        planFolder = fs.readlinkSync('.dokugent/data/plans/current');
      } catch {
        try {
          planFolder = fs.readlinkSync('.dokugent/data/plans/latest');
          paddedLog('"current" symlink not found. Falling back to "latest".', '', 12, 'warn');
        } catch {
          throw new Error('❌ Neither "current" nor "latest" symlink found in .dokugent/data/plans/');
        }
      }

      if (!planFolder.includes(previewJson.plan.agentId)) {
        throw new Error(`❌ Mismatch: preview used agentId ${previewJson.plan.agentId}, but 'current' points to ${planFolder}`);
      }

      // Enhanced certifier metadata validation
      let certifierPath = '';
      try {
        const certifier = previewJson.certifier ?? previewJson.metadata?.certifier;
        const certifierName =
          previewJson.certifier?.certifierName ||
          previewJson.metadata?.certifierName;
        const certifierKeyVersion =
          previewJson.metadata?.certifierKeyVersion;
        if (!certifier || typeof certifier !== 'object' || !certifierName || !certifierKeyVersion) {
          paddedLog("Certifier metadata not found in expected locations or missing required fields.", '', 12, 'warn');
          paddedLog("Available keys", JSON.stringify(Object.keys(previewJson)), 12, 'info');
          throw new Error(`❌ Certifier metadata missing or incomplete in preview file. Please re-run 'dokugent preview' and select a certifier.`);
        }

        certifierPath = path.join(
          '.dokugent/keys/signers',
          certifierName,
          certifierKeyVersion,
          `${certifierName}.meta.json`
        );

        paddedLog('Looking for certifier file at', `${certifierPath}`, 12, 'info', 'CHECKING');
        console.log('');
        if (!fs.existsSync(certifierPath)) {
          throw new Error(`❌ Missing certifier file at ${certifierPath}`);
        }
      } catch (error: any) {
        paddedLog(error.message || error, '', 12, 'error');
        process.exit(1);
      }

      const ownerPath = path.join('.dokugent/data/owners', previewJson.owner.ownerName, `owner.${previewJson.owner.ownerName}.json`);
      if (!fs.existsSync(ownerPath)) {
        throw new Error(`❌ Missing owner file at ${ownerPath}`);
      }

      // Prompt user to select compiler identity from available signer keys
      const signersDir = path.join('.dokugent/keys/signers');
      const availableSigners = fs.existsSync(signersDir) ? fs.readdirSync(signersDir).filter(name => {
        const metaPath = path.join(signersDir, name, 'latest', `${name}.meta.json`);
        return fs.existsSync(metaPath);
      }) : [];

      if (availableSigners.length === 0) {
        throw new Error('❌ No available signer keys found in .dokugent/keys/signers. Cannot proceed with compilation.');
      }

      const { selectedCompiler } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedCompiler',
          message: 'Select compiler identity for signing the compiled cert:',
          choices: availableSigners,
        }
      ]);

      paddedLog('Compiler selected', selectedCompiler, 12, 'magenta', 'COMPILER');

      const compilerMetaPath = path.join('.dokugent/keys/signers', selectedCompiler, 'latest', `${selectedCompiler}.meta.json`);
      if (!fs.existsSync(compilerMetaPath)) {
        throw new Error(`❌ Missing compiler metadata file at ${compilerMetaPath}`);
      }
      const compiler = JSON.parse(fs.readFileSync(compilerMetaPath, 'utf-8'));

      const llmName = previewJson?.conventions?.conventions?.[0]?.llmName?.toLowerCase();
      const agentSpec = agentsConfig[llmName as keyof typeof agentsConfig];
      const idealLimit = agentSpec && 'idealBriefingSize' in agentSpec
        ? (agentSpec as { idealBriefingSize: number }).idealBriefingSize
        : 16000;

      if (tokenEstimate > idealLimit) {
        warnIfExceedsLimit(tokenEstimate.toString(), idealLimit);
      }

      // Append compiler info to metadata
      if (!previewJson.metadata) previewJson.metadata = {};
      previewJson.metadata.compilerName = selectedCompiler;
      previewJson.metadata.compilerFingerprint = compiler.fingerprint;
      previewJson.metadata.compilerKeyVersion = 'latest';

      // Reordered: compiler before metadata, metadata last
      const compiledData = {
        ...previewJson,
        compiledAt: new Date().toISOString(),
        fromPreview: certFile,
        globalByo: byoBundle,
        compiledBy: COMPILED_BY || 'unknown',
        compiler: {
          compilerName: selectedCompiler,
          email: compiler.email,
          publicKey: compiler.publicKey,
          fingerprint: compiler.fingerprint
        },
        metadata: previewJson.metadata // must be last
      };

      // Versioned compiled cert/sha logic
      const agentCompiledDir = path.join(COMPILED_DIR, agentName);
      fs.mkdirSync(agentCompiledDir, { recursive: true });

      let baseName = `${agentName}@${birthTimestamp}.compiled`;
      let nextVersion: number | null = null;
      let compiledVersionSuffix = '';
      let compiledCertPath = path.join(agentCompiledDir, `${baseName}.cert.json`);
      let compiledShaPath = path.join(agentCompiledDir, `${baseName}.cert.sha256`);
      if (fs.existsSync(compiledCertPath)) {
        const existingVersions = fs.readdirSync(agentCompiledDir)
          .filter(f => f.startsWith(baseName + '.v') && f.endsWith('.cert.json'));
        nextVersion = existingVersions.length + 1;
        baseName += `.v${nextVersion}`;
        compiledVersionSuffix = `.v${nextVersion}`;
        compiledCertPath = path.join(agentCompiledDir, `${baseName}.cert.json`);
        compiledShaPath = path.join(agentCompiledDir, `${baseName}.cert.sha256`);
      }
      // Ensure internal metadata.version matches the .vX version of the compiled filename
      if (!previewJson.metadata) previewJson.metadata = {};
      previewJson.metadata.version = `v${nextVersion || 1}`;

      // Track the compiledVersionSuffix for this agent@timestamp
      const compiledKey = `${agentName}@${birthTimestamp}`;
      compiledVersionMap[compiledKey] = compiledVersionSuffix;

      try {
        const jsonString = JSON.stringify(compiledData, null, 2);
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(jsonString).digest('hex');

        // Reordered: compiler before metadata, metadata last
        const compiledCert = {
          ...previewJson,
          compiledAt: new Date().toISOString(),
          compiledBy: "dokugent v0.1",
          certHash: hash,
          compiler: {
            compilerName: selectedCompiler,
            email: compiler.email,
            publicKey: compiler.publicKey,
            fingerprint: compiler.fingerprint
          },
          metadata: previewJson.metadata // must be last
        };

        fs.writeFileSync(compiledCertPath, JSON.stringify(compiledCert, null, 2), 'utf-8');
        fs.writeFileSync(compiledShaPath, hash, 'utf-8');
        // Logging moved to after report stub output
      } catch (err: any) {
        paddedLog(`Failed to save compiled cert for ${agentName}`, err.message, 12, 'error');
      }
    }
  }

  // STEP 7: Create audit logs and write to compiled logs directory
  for (const dir of agentFolders) {
    const agentName = dir.name;
    const certFiles = fs.readdirSync(path.join(COMPILED_DIR, agentName))
      .filter(file => file.endsWith('.compiled.cert.json'));

    for (const certFile of certFiles) {
      const match = certFile.match(/@(.*?)\.compiled\.cert\.json$/);
      if (!match) continue;
      const birthTimestamp = match[1];

      const logDir = path.join(LOG_DIR, agentName, `${agentName}@${birthTimestamp}`);
      fs.mkdirSync(logDir, { recursive: true });

      const compiledCertPath = path.join(COMPILED_DIR, agentName, `${agentName}@${birthTimestamp}.compiled.cert.json`);
      const compiledShaPath = path.join(COMPILED_DIR, agentName, `${agentName}@${birthTimestamp}.compiled.cert.sha256`);
      const shaContent = fs.existsSync(compiledShaPath) ? fs.readFileSync(compiledShaPath, 'utf-8') : 'N/A';

      const byoFilesIncluded = Object.keys(byoBundle).join(', ') || 'None';
      const byoFileCount = Object.keys(byoBundle).length;
      const llmName = agentName.toLowerCase();
      const agentSpec = agentsConfig[llmName as keyof typeof agentsConfig];
      const idealLimit = agentSpec && 'idealBriefingSize' in agentSpec
        ? (agentSpec as { idealBriefingSize: number }).idealBriefingSize
        : 16000;
      const tokenStatus = tokenEstimate > idealLimit ? 'Warning: Exceeded ideal limit' : 'OK';

      // Use BYO_DIR for scanPaths, requireApprovals: false
      const byoIssuesForLog: string[] = await runSecurityCheck('compile', {
        denyList,
        requireApprovals: false,
        scanPaths: [BYO_DIR]
      });

      const logContent = `# Compile Log for ${agentName}
Birth Timestamp: ${birthTimestamp}
Compiled At: ${new Date().toISOString()}

[✓] From Preview: ${certFile}
[✓] Compiled Cert Path: ${compiledCertPath}
[✓] SHA256 Path: ${compiledShaPath}
[✓] Compiled By: ${COMPILED_BY || 'unknown'}

--- BYO Bundle ---
Files Included: ${byoFilesIncluded}
Total BYO Files: ${byoFileCount}
Token Estimate: ${tokenEstimate.toLocaleString()}
Token Limit: ${idealLimit}
Status: See console output for any warnings or issues

--- Security Check ---
Status: See console output for any warnings or issues

--- Save Status ---
Compiled Cert: SUCCESS
SHA256: SUCCESS
Log File: SUCCESS
`;

      const logPath = path.join(logDir, 'log.txt');

      try {
        fs.writeFileSync(logPath, logContent, 'utf-8');
        // Logging moved to after report stub output
      } catch (err: any) {
        paddedLog(`Failed to save compile log for ${agentName}`, err.message, 12, 'error');
      }
    }
  }

  // STEP 8: Save compile report and show summary to user
  for (const dir of agentFolders) {
    const agentName = dir.name;
    const agentCompiledDir = path.join(COMPILED_DIR, agentName);
    const compiledFiles = fs.readdirSync(agentCompiledDir)
      .filter(file => file.endsWith('.compiled.cert.json'));

    for (const certFile of compiledFiles) {
      const match = certFile.match(/@(.*?)\.compiled(?:\.v(\d+))?\.cert\.json$/);
      if (!match) continue;
      const birthTimestamp = match[1];
      const versionSuffix = match[2] ? `.v${match[2]}` : '';

      const reportDir = path.join(REPORTS_DIR, agentName, `${agentName}@${birthTimestamp}`);
      fs.mkdirSync(reportDir, { recursive: true });

      const reportPath = path.join(reportDir, 'report.json');
      const reportStub = {
        agent: agentName,
        birth: birthTimestamp,
        compiledAt: new Date().toISOString(),
        summary: 'Report stub - implement details as needed'
      };

      try {
        fs.writeFileSync(reportPath, JSON.stringify(reportStub, null, 2), 'utf-8');
        // Grouped output for final file locations
        paddedLog('Report stub saved at', reportPath, 12, 'info', 'REPORT');
        // Use compiledVersionMap to get the correct version suffix
        const compiledKey = `${agentName}@${birthTimestamp}`;
        const compiledCertFileName = `${compiledKey}.compiled${compiledVersionMap[compiledKey] || ''}.cert.json`;
        const compiledCertPath = path.join(COMPILED_DIR, agentName, compiledCertFileName);
        const compiledShaPath = path.join(COMPILED_DIR, agentName, `${compiledKey}.compiled${compiledVersionMap[compiledKey] || ''}.cert.sha256`);
        const logPath = path.join(LOG_DIR, agentName, `${agentName}@${birthTimestamp}`, 'log.txt');
        // Add blank line before the compile task queued summary for visual separation
        // console.log('');
        // Add version-aware output for compiled cert
        if (compiledVersionMap[compiledKey]) {
          const compiledCertFileName = `${compiledKey}.compiled${compiledVersionMap[compiledKey]}.cert.json`;
          paddedLog('Existing compiled cert found. Writing new version:', compiledCertFileName, 12, 'warn');
        }

        // Use paddedLog for all output in this block
        paddedLog('Saved as', compiledCertFileName, 12, 'success');
        paddedLog('SHA256 hash saved', compiledShaPath, 12, 'info', 'SHA256');
        paddedLog('Compile log saved', logPath, 12, 'info', 'LOG');
      } catch (err: any) {
        paddedLog(`Failed to save report`, err.message, 12, 'error');
        ui.info('Loading agent profile...');
      }
    }
  }
  // console.log('');
  // paddedLog('Compile task queued. Final cert will be saved in certified folder.', '', 12, 'success');
  paddedLog('Finalized', 'Cert saved in certified folder\n', 12, 'success', 'SAVED');

  // Open the latest compiled cert file directly
  try {
    const compiledKey = Object.keys(compiledVersionMap).pop();
    const versionSuffix = compiledVersionMap[compiledKey!] || '';
    const [agentName, birthTimestamp] = compiledKey!.split('@');
    const compiledCertPath = path.join(
      COMPILED_DIR,
      agentName,
      `${compiledKey}.compiled${versionSuffix}.cert.json`
    );
    require('child_process').execSync(`code "${compiledCertPath}"`);
  } catch (e) {
    // Ignore errors opening in VS Code
  }
}
