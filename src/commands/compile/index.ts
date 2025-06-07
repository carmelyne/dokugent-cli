// Fixed agent identity validation logic
// Replace the problematic section in your runCompileCommand function
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
// Debug script to find where 492 is coming from
// Add this debugging code to your runCompileCommand function

export async function debugIdentityMismatch() {
  console.log('\n=== DEBUGGING IDENTITY MISMATCH ===\n');

  const currentIdentityPath = '.dokugent/data/agents/current/identity.json';
  let currentIdentity: any = null;
  if (fs.existsSync(currentIdentityPath)) {
    currentIdentity = JSON.parse(fs.readFileSync(currentIdentityPath, 'utf-8'));
  } else {
    console.log('🔴 Current identity not found at:', currentIdentityPath);
    return;
  }

  // Check current identity
  if (currentIdentity) {
    console.log('🟢 Current Identity:');
    console.log(`   File: ${currentIdentityPath}`);
    console.log(`   Agent: ${currentIdentity.agentName}`);
    console.log(`   Birth: ${currentIdentity.birth}`);
    console.log(`   Full ID: ${currentIdentity.agentName}@${currentIdentity.birth}`);
    console.log('');
  }

  // Check latest identity
  const latestIdentityPath = '.dokugent/data/agents/latest/identity.json';
  if (fs.existsSync(latestIdentityPath)) {
    const latestIdentity = JSON.parse(fs.readFileSync(latestIdentityPath, 'utf-8'));
    console.log('🟡 Latest Identity:');
    console.log(`   File: ${latestIdentityPath}`);
    console.log(`   Agent: ${latestIdentity.agentName}`);
    console.log(`   Birth: ${latestIdentity.birth}`);
    console.log(`   Full ID: ${latestIdentity.agentName}@${latestIdentity.birth}`);
    console.log('');
  } else {
    console.log('🔴 Latest identity not found at:', latestIdentityPath);
  }

  // Dynamically check preview file for current agent
  const previewPath = path.join('.dokugent/ops/previews', currentIdentity.agentName, `${currentIdentity.agentName}@${currentIdentity.birth}_preview.json`);
  if (fs.existsSync(previewPath)) {
    const previewJson = JSON.parse(fs.readFileSync(previewPath, 'utf-8'));
    console.log('📄 Preview File:');
    console.log(`   File: ${previewPath}`);
    console.log(`   Plan Agent ID: ${previewJson.plan?.agentId || 'NOT FOUND'}`);
    console.log('');

    // Placeholder: Insert pattern-based scanning logic here if needed in future (e.g., via --find flag)
  } else {
    console.log('🔴 Preview file not found at:', previewPath);
  }

  // Dynamically scan certs for target substring
  // scanCertFilesForIdentity(currentIdentity.agentName, 'your-pattern-here');

  // Search for any files containing pattern in common directories
  const searchDirs = [
    '.dokugent/data/agents',
    '.dokugent/ops/previews',
    '.dokugent/ops/certified'
  ];

  console.log('🔍 Searching for files containing pattern:');
  searchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      // searchForPattern(dir, 'your-pattern-here');
    }
  });

  // TODO: This function should take a user-defined pattern or be removed if no longer used.
}

function searchForPattern(dirPath: string, pattern: string, depth = 0) {
  if (depth > 3) return; // Prevent infinite recursion

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    items.forEach(item => {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        searchForPattern(fullPath, pattern, depth + 1);
      } else if (item.name.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes(pattern)) {
            console.log(`   🎯 Found "${pattern}" in: ${fullPath}`);

            // Show the specific lines containing the pattern
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.includes(pattern)) {
                console.log(`      Line ${index + 1}: ${line.trim()}`);
              }
            });
          }
        } catch (err) {
          // Ignore files that can't be read
        }
      }
    });
  } catch (err) {
    // Ignore directories that can't be read
  }
}

// Call this function at the beginning of your runCompileCommand
// debugIdentityMismatch();
export async function runCompileCommand(agentId?: string) {
  paddedLog('Iniatiate', 'Running dokugent compile...', 12, 'info', 'START');

  // Parse --find option from command line arguments

  // STEP 1: Load current/latest agent identity first
  let currentIdentity: any = null;
  let identitySource: string = '';

  // Try to load current identity first
  const currentIdentityPath = '.dokugent/data/agents/current/identity.json';
  const latestIdentityPath = '.dokugent/data/agents/latest/identity.json';

  if (fs.existsSync(currentIdentityPath)) {
    currentIdentity = JSON.parse(fs.readFileSync(currentIdentityPath, 'utf-8'));
    identitySource = 'current';
    paddedLog('Using current agent identity', `${currentIdentity.agentName}@${currentIdentity.birth}`, 12, 'info', 'IDENTITY');
  } else if (fs.existsSync(latestIdentityPath)) {
    currentIdentity = JSON.parse(fs.readFileSync(latestIdentityPath, 'utf-8'));
    identitySource = 'latest';
    paddedLog('Current identity not found. Using latest agent identity', `${currentIdentity.agentName}@${currentIdentity.birth}`, 12, 'warn', 'IDENTITY');
  } else {
    throw new Error('❌ Neither "current" nor "latest" identity.json found in .dokugent/data/agents/');
  }

  const expectedAgentId = `${currentIdentity.agentName}@${currentIdentity.birth}`;
  paddedLog('Expected agent ID for compilation', expectedAgentId, 12, 'info', 'VALIDATION');

  // STEP 2: Find and validate cert files for the current agent only
  const targetAgentName = currentIdentity.agentName;
  const targetAgentCertDir = path.join(CERT_DIR, targetAgentName);

  if (!fs.existsSync(targetAgentCertDir)) {
    throw new Error(`❌ No cert directory found for agent ${targetAgentName} at ${targetAgentCertDir}`);
  }

  const certFiles = fs.readdirSync(targetAgentCertDir)
    .filter(file => file.endsWith('.cert.json') && file.includes('@'));

  const matchingCerts = certFiles.filter(file =>
    file.startsWith(targetAgentName + '@') && file.endsWith('.cert.json')
  );

  if (matchingCerts.length === 0) {
    throw new Error(`❌ No valid cert files found for agent ${targetAgentName} in ${targetAgentCertDir}`);
  }

  paddedLog(`Found ${matchingCerts.length} cert file(s) for agent ${targetAgentName}`, '', 0, 'info', '📦');

  // STEP 3: Load and validate BYO files (your existing logic)
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

  // STEP 4: Process only the matching cert files for the current agent
  for (const certFile of matchingCerts) {
    const match = certFile.match(/@(.*?)\.cert\.json$/);
    if (!match) continue;
    const birthTimestamp = match[1];

    const previewPath = path.join(targetAgentCertDir, certFile);
    const previewJson = JSON.parse(fs.readFileSync(previewPath, 'utf-8'));

    // STEP 5: Validate that the preview matches the current agent identity
    if (!previewJson.plan || !previewJson.plan.agentId) {
      throw new Error(`❌ Preview file ${certFile} is missing plan.agentId`);
    }

    if (previewJson.plan.agentId !== expectedAgentId) {
      throw new Error(`❌ Agent ID mismatch:
        Preview file: ${previewJson.plan.agentId}
        Expected (from ${identitySource}): ${expectedAgentId}

        Please ensure you're compiling the correct agent or update your current/latest identity.`);
    }

    paddedLog('Agent ID validation passed', `${previewJson.plan.agentId} ✓`, 12, 'success', 'VALIDATED');

    // === CERTIFIER METADATA VALIDATION ===
    let certifierPath = '';
    try {
      const certifier = previewJson.certifier ?? previewJson.metadata?.certifier;
      const certifierName =
        previewJson.certifier?.certifierName ||
        previewJson.metadata?.certifierName;
      const certifierKeyVersion =
        previewJson.metadata?.certifierKeyVersion;
      if (!certifier || typeof certifier !== 'object' || !certifierName || !certifierKeyVersion) {
        paddedLog("Certifier metadata not found or incomplete.", '', 12, 'warn');
        throw new Error(`❌ Certifier metadata missing. Please re-run 'dokugent preview' and select a certifier.`);
      }

      certifierPath = path.join(
        '.dokugent/keys/signers',
        certifierName,
        certifierKeyVersion,
        `${certifierName}.meta.json`
      );

      paddedLog('Looking for certifier file at', `${certifierPath}`, 12, 'info', 'CHECKING');
      if (!fs.existsSync(certifierPath)) {
        throw new Error(`❌ Missing certifier file at ${certifierPath}`);
      }
    } catch (error: any) {
      paddedLog(error.message || error, '', 12, 'error');
      process.exit(1);
    }

    // === SELECT COMPILER IDENTITY ===
    const signersDir = path.join('.dokugent/keys/signers');
    const availableSigners = fs.readdirSync(signersDir)
      .filter(name => fs.existsSync(path.join(signersDir, name, 'latest', `${name}.meta.json`)));

    const { selectedCompiler } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCompiler',
        message: 'Select compiler identity:',
        choices: availableSigners,
      }
    ]);

    // Load compiler metadata and set COMPILED_BY for use below
    const compilerMetaPath = path.join(signersDir, selectedCompiler, 'latest', `${selectedCompiler}.meta.json`);
    const compiler = JSON.parse(fs.readFileSync(compilerMetaPath, 'utf-8'));
    const COMPILED_BY = process.env.DOKUGENT_COMPILED_BY || 'unknown';

    // === COMPILE ===
    if (!previewJson.metadata) previewJson.metadata = {};
    previewJson.metadata.compilerName = selectedCompiler;
    previewJson.metadata.compilerFingerprint = compiler.fingerprint;
    previewJson.metadata.compilerKeyVersion = 'latest';

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

    // === VERSIONING ===
    // Save compiled files under .dokugent/ops/compiled/{agentId}/...
    const agentCompiledDir = path.join(COMPILED_DIR, expectedAgentId);
    fs.mkdirSync(agentCompiledDir, { recursive: true });

    let baseName = `${expectedAgentId}.compiled`;
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
    previewJson.metadata.version = `v${nextVersion || 1}`;

    // === HASH + WRITE ===
    const crypto = await import('crypto');
    const jsonString = JSON.stringify(compiledData, null, 2);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');

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
      metadata: previewJson.metadata
    };

    fs.writeFileSync(compiledCertPath, JSON.stringify(compiledCert, null, 2), 'utf-8');
    fs.writeFileSync(compiledShaPath, hash, 'utf-8');

    paddedLog('Saved compiled cert', compiledCertPath, 12, 'success', 'CERT');
    paddedLog('SHA256 hash saved', compiledShaPath, 12, 'info', 'SHA256');
  }
}


// Helper function to scan cert files for a specific substring in their filenames
function scanCertFilesForIdentity(agentName: string, targetSubstring: string) {
  const certDir = path.join('.dokugent/ops/certified', agentName);
  if (fs.existsSync(certDir)) {
    const certFiles = fs.readdirSync(certDir);
    console.log(`📁 Cert Directory Files for ${agentName}:`);
    certFiles.forEach(file => {
      console.log(`   ${file}`);
      // if (file.includes(targetSubstring)) {
      //   console.log(`     ⚠️  This file contains "${targetSubstring}"`);
      // }
    });
    console.log('');
  } else {
    console.log(`🔴 Cert directory does not exist for agent ${agentName}: ${certDir}`);
  }
}
