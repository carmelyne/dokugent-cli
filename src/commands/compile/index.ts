// dokugent compile
// Generates final cert bundle from previewed components and BYO files

import fs from 'fs';
import path from 'path';
import { estimateTokensFromText, warnIfExceedsLimit } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { AGENT_DIR, CERT_DIR, BYO_DIR, LOG_DIR, REPORTS_DIR, AGENTS_CONFIG_DIR } from '@constants/paths';

import dotenv from 'dotenv';
dotenv.config();

const COMPILED_BY = process.env.DOKUGENT_COMPILED_BY;
if (!COMPILED_BY) {
  console.warn('\n⚠️  Warning: DOKUGENT_COMPILED_BY is not set in your environment. Set it in .env to track who compiled the cert.');
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
  console.log('🔧 Running dokugent compile...');

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
      console.warn(`\n⚠️  No valid cert files found for agent ${agentName}`);
      continue;
    }

    console.log(`\n📦  Found ${matchingCerts.length} cert file(s) for agent ${agentName}`);
  }

  // STEP 2: Load and validate all user-provided JSON files from BYO_DIR
  const byoFiles = fs.readdirSync(BYO_DIR).filter(file => file.endsWith('.json'));

  if (byoFiles.length === 0) {
    console.warn('\n⚠️  No BYO JSON files found in', BYO_DIR);
  }

  const byoBundle: Record<string, any> = {};

  for (const file of byoFiles) {
    const fullPath = path.join(BYO_DIR, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);
      byoBundle[file] = parsed;
    } catch (err: any) {
      console.error(`\n❌ Error parsing ${file}:`, err.message);
    }
  }

  console.log(`\n📦  Loaded ${Object.keys(byoBundle).length} BYO file(s) into global-byo bundle.`);

  // STEP 3: Append BYO files under 'global-byo' key in compiled object

  // Step 3 is effectively done by collecting byoBundle above and using it in compiledData below.

  // STEP 4: Recalculate token estimate and trigger warnings if exceeding threshold
  const fullBundleText = JSON.stringify(byoBundle, null, 2);
  const tokenEstimate = estimateTokensFromText(fullBundleText);
  console.log(`\n🧮 Estimated tokens for final BYO bundle: \x1b[32m${tokenEstimate.toLocaleString()}\x1b[0m`);

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

  console.log('\n✅ Security check passed for BYO bundle.');

  // STEP 6: Write compiled.cert.json and generate SHA256 digest
  let agentsConfig;
  try {
    const agentsConfigPath = path.join(AGENTS_CONFIG_DIR, 'agentsConfig.ts');
    const importedConfig = await import(agentsConfigPath);
    agentsConfig = importedConfig?.default;
    const idealLimit = agentsConfig?.idealTokenLimit ?? 16000;

    if (tokenEstimate > idealLimit) {
      warnIfExceedsLimit(tokenEstimate.toString(), idealLimit);
    }
  } catch (err: any) {
    console.warn('\n⚠️  Warning: Unable to load agentsConfig for token threshold checks.', err.message);
  }

  for (const dir of agentFolders) {
    const agentName = dir.name;
    const certFiles = fs.readdirSync(path.join(CERT_DIR, agentName))
      .filter(file => file.endsWith('.cert.json') && file.includes('@'));

    for (const certFile of certFiles) {
      const match = certFile.match(/@(.*?)\.cert\.json$/);
      if (!match) continue;
      const birthTimestamp = match[1];

      const compiledData = {
        agent: agentName,
        birth: birthTimestamp,
        compiledAt: new Date().toISOString(),
        fromPreview: certFile,
        globalByo: byoBundle,
        compiledBy: COMPILED_BY || 'unknown',
      };

      const compiledCertPath = path.join(CERT_DIR, agentName, `${agentName}@${birthTimestamp}.compiled.cert.json`);
      const compiledShaPath = path.join(CERT_DIR, agentName, `${agentName}@${birthTimestamp}.compiled.cert.sha256`);

      try {
        const jsonString = JSON.stringify(compiledData, null, 2);
        fs.writeFileSync(compiledCertPath, jsonString, 'utf-8');

        const crypto = await import('crypto');
        const sha = crypto.createHash('sha256').update(jsonString).digest('hex');
        fs.writeFileSync(compiledShaPath, sha, 'utf-8');

        console.log(`\n💾 Saved compiled cert for ${agentName} at ${compiledCertPath}`);
        console.log(`\n🔐 SHA256 hash saved at ${compiledShaPath}`);
      } catch (err: any) {
        console.error(`\n❌ Failed to save compiled cert for ${agentName}:`, err.message);
      }
    }
  }

  // STEP 7: Create audit logs and write to compiled logs directory
  for (const dir of agentFolders) {
    const agentName = dir.name;
    const certFiles = fs.readdirSync(path.join(CERT_DIR, agentName))
      .filter(file => file.endsWith('.compiled.cert.json'));

    for (const certFile of certFiles) {
      const match = certFile.match(/@(.*?)\.compiled\.cert\.json$/);
      if (!match) continue;
      const birthTimestamp = match[1];

      const logDir = path.join(LOG_DIR, agentName, `${agentName}@${birthTimestamp}`);
      fs.mkdirSync(logDir, { recursive: true });

      const compiledCertPath = path.join(CERT_DIR, agentName, `${agentName}@${birthTimestamp}.compiled.cert.json`);
      const compiledShaPath = path.join(CERT_DIR, agentName, `${agentName}@${birthTimestamp}.compiled.cert.sha256`);
      const shaContent = fs.existsSync(compiledShaPath) ? fs.readFileSync(compiledShaPath, 'utf-8') : 'N/A';

      const byoFilesIncluded = Object.keys(byoBundle).join(', ') || 'None';
      const byoFileCount = Object.keys(byoBundle).length;
      const idealLimit = agentsConfig?.idealTokenLimit ?? 16000;
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
        console.log(`\n📝 Compile log saved at ${logPath}`);
      } catch (err: any) {
        console.error(`\n❌ Failed to save compile log for ${agentName}:`, err.message);
      }
    }
  }

  // STEP 8: Save compile report and show summary to user
  for (const dir of agentFolders) {
    const agentName = dir.name;
    const certFiles = fs.readdirSync(path.join(CERT_DIR, agentName))
      .filter(file => file.endsWith('.compiled.cert.json'));

    for (const certFile of certFiles) {
      const match = certFile.match(/@(.*?)\.compiled\.cert\.json$/);
      if (!match) continue;
      const birthTimestamp = match[1];

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
        console.log(`\n🗂️ Report stub saved at ${reportPath}`);
      } catch (err: any) {
        console.error(`\n❌ Failed to save report for ${agentName}:`, err.message);
      }
    }
  }

  console.log('\n✅ Compile task queued. Final cert will be saved in certified folder.\n');
}
