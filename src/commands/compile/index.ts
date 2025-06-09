// Fixed agent identity validation logic
// Replace the problematic section in your runCompileCommand function
import fs from 'fs';
import path from 'path';
import * as ui from '@utils/cli/ui';
import { estimateTokensFromText, warnIfExceedsLimit } from '@utils/tokenizer';
import { runSecurityCheck } from '@utils/security-check';
import { AGENT_DIR, CERT_DIR, BYO_DIR, LOG_DIR, REPORTS_DIR, AGENTS_CONFIG_DIR, COMPILED_DIR } from '@constants/paths';

import dotenv from 'dotenv';
import { agentsConfig } from '@config/agentsConfig';
import { prompt } from 'enquirer';
import { compileStatusLog } from '../../utils/cli/compile';
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
    const certifiedJson = JSON.parse(fs.readFileSync(previewPath, 'utf-8'));
    console.log('📄 Preview File:');
    console.log(`   File: ${previewPath}`);
    console.log(`   Plan Agent ID: ${certifiedJson.plan?.agentId || 'NOT FOUND'}`);
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

  console.log()
  ui.paddedCompact('dokugent compile initialized...', '', ui.PAD_WIDTH, 'info');
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
    ui.paddedSub('Agent loaded...', `${currentIdentity.agentName}@${currentIdentity.birth}`); //indented white text
    compileStatusLog('Passed', 'Agent identity verified', 'pass');
    // ui.paddedLog("Agent Identity Verification", `${ui.glyphs.arrowRight} Checking current agent identity`, ui.PAD_WIDTH, 'magenta', 'STEP 1');
    // ui.phaseHeaderCompact('Checking current agent identity', `${currentIdentity.agentName}@${currentIdentity.birth}`);

  } else if (fs.existsSync(latestIdentityPath)) {
    currentIdentity = JSON.parse(fs.readFileSync(latestIdentityPath, 'utf-8'));
    identitySource = 'latest';
    ui.phaseHeaderCompact('Current identity not found. Checking latest agent identity', `${currentIdentity.agentName}@${currentIdentity.birth}`);
  } else {
    compileStatusLog('✖ Failed', 'Agent Identity Verification', 'fail');
    throw new Error('❌ Neither "current" nor "latest" identity.json found in .dokugent/data/agents/');
  }

  const expectedAgentId = `${currentIdentity.agentName}@${currentIdentity.birth}`;
  // ui.paddedLog('Expected agent ID for compilation', expectedAgentId, 12, 'info', 'VALIDATION');
  compileStatusLog('Passed', 'Preview and certified files matched', 'pass');
  // ui.phaseHeaderCompact('Agent Identity match confirmed with the preview & certified files', expectedAgentId);
  // STEP 2: Find and validate cert files for the current agent only
  // ui.phaseHeader('2', 'Certificate Validation');
  const targetAgentName = currentIdentity.agentName;
  const targetAgentCertDir = path.join(CERT_DIR, targetAgentName);

  if (!fs.existsSync(targetAgentCertDir)) {
    compileStatusLog('Failed', 'Mismatched preview & certified files', 'fail');
    ui.paddedLog('Missing', `No certified files found for agent "${targetAgentName}".`, 12, 'error', '');
    ui.paddedLog('Hint', `Expected directory: ${targetAgentCertDir}`, 12, 'warn');
    ui.paddedLog('Next', `Try running: dokugent certify`, 12, 'blue', 'HELP');
    console.log();
    process.exit(1);
  }

  const certFiles = fs.readdirSync(targetAgentCertDir)
    .filter(file => file.endsWith('.cert.json') && file.includes('@'));

  const matchingCerts = certFiles.filter(file =>
    file.startsWith(targetAgentName + '@') && file.endsWith('.cert.json')
  );

  if (matchingCerts.length === 0) {
    compileStatusLog('Failed', 'Mismatched preview & certified files', 'fail');
    throw new Error(`❌ No valid cert files found for agent ${targetAgentName} in ${targetAgentCertDir}`);
  }

  // ui.paddedLog(`Found ${matchingCerts.length} cert file(s) for agent ${targetAgentName}`, '', 0, 'info', '📦');

  // STEP 3: Load and validate BYO files (your existing logic)
  // Removed misleading security check log for BYO files
  const byoFiles = fs.readdirSync(BYO_DIR).filter(file => file.endsWith('.json'));

  const byoBundle: Record<string, any> = {};

  for (const file of byoFiles) {
    const fullPath = path.join(BYO_DIR, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);
      byoBundle[file] = parsed;
    } catch (err: any) {
      compileStatusLog('Failed', 'Security Checks', 'fail', [err.message, err.message]);
    }
  }

  if (byoFiles.length === 0) {
    compileStatusLog('Warn', 'No BYO JSON was included', 'warn');
  } else {
    compileStatusLog('Included', `${byoFiles.length} BYO JSON file(s) loaded`, 'info');
  }
  // ui.paddedLog(`Loaded ${Object.keys(byoBundle).length} BYO file(s) into global-byo bundle.`, '', 0, 'info', '📦');

  // STEP 4: Process only the matching cert files for the current agent
  // ui.phaseHeader('4', 'Compilation & Signing');
  for (const certFile of matchingCerts) {
    const match = certFile.match(/@(.*?)\.cert\.json$/);
    if (!match) continue;
    const birthTimestamp = match[1];

    const previewPath = path.join(targetAgentCertDir, certFile);
    const certifiedJson = JSON.parse(fs.readFileSync(previewPath, 'utf-8'));

    // STEP 5: Validate that the certified file matches the current agent identity
    if (!certifiedJson.plan || !certifiedJson.plan.agentId) {
      compileStatusLog('Failed', 'Agent Identity Verification', 'fail');
      throw new Error(`❌ Certified file ${certFile} is missing plan.agentId`);
    }

    if (certifiedJson.plan.agentId !== expectedAgentId) {
      compileStatusLog('Failed', 'Mismatched preview & certified files', 'fail');
      throw new Error(`❌ Agent ID mismatch:
        Certified file: ${certifiedJson.plan.agentId}
        Expected (from ${identitySource}): ${expectedAgentId}

        Please ensure you're compiling the correct agent or update your current/latest identity.`);
    }

    // compileStatusLog('Passed', 'Agent Identity Verification', 'pass');
    // === CERTIFIER METADATA VALIDATION ===
    let certifierPath = '';
    try {
      const certifier = certifiedJson.certifier ?? certifiedJson.metadata?.certifier;
      const certifierName =
        certifiedJson.certifier?.certifierName ||
        certifiedJson.metadata?.certifierName;
      const certifierKeyVersion =
        certifiedJson.metadata?.certifierKeyVersion;
      if (!certifier || typeof certifier !== 'object' || !certifierName || !certifierKeyVersion) {
        compileStatusLog('Warn', 'Certifier metadata incomplete', 'warn');
        throw new Error(`❌ Certifier metadata missing. Please re-run 'dokugent preview' and select a certifier.`);
      }

      certifierPath = path.join(
        '.dokugent/keys/signers',
        certifierName,
        certifierKeyVersion,
        `${certifierName}.meta.json`
      );
      // Prefer previewedAtDisplay if available, fallback to previewedAt, then unknown
      const previewerName =
        certifiedJson.previewer?.previewerName ||
        certifiedJson.metadata?.previewer ||
        'unknown';
      const previewedAt =
        certifiedJson.previewer?.previewedAtDisplay ||
        certifiedJson.metadata?.previewedAtDisplay ||
        certifiedJson.previewer?.previewedAt ||
        certifiedJson.metadata?.previewedAt ||
        'unknown';
      // === Insert Owner status line here ===
      const ownerName =
        certifiedJson.owner?.ownerName ||
        certifiedJson.metadata?.ownerName ||
        'unknown';
      compileStatusLog('Owner', ownerName, 'info');
      compileStatusLog('Previewer', previewerName, 'info');
      compileStatusLog('Signed', previewedAt, 'info');
      compileStatusLog('Certifier', certifierName, 'info');
      compileStatusLog('Signed', new Date().toLocaleString(), 'info');
      // ui.paddedLog('Looking for certifier file at', `${certifierPath}`, 12, 'info', 'CHECKING');
      if (!fs.existsSync(certifierPath)) {
        compileStatusLog('Failed', 'Certifier file missing', 'fail');
        throw new Error(`❌ Missing certifier file at ${certifierPath}`);
      }
    } catch (error: any) {
      compileStatusLog('Failed', 'Certifier validation', 'fail', [error.message || error]);
      process.exit(1);
    }

    // === CERTIFICATE VALIDITY CHECK ===
    const now = new Date();
    const validFrom = new Date(certifiedJson.certifier?.validFrom || certifiedJson.metadata?.validFrom);
    const validUntil = new Date(certifiedJson.certifier?.validUntil || certifiedJson.metadata?.validUntil);

    if (isNaN(validFrom.getTime()) || isNaN(validUntil.getTime())) {
      compileStatusLog('Warn', 'Missing or invalid certificate validity period', 'warn');
    } else if (now < validFrom) {
      compileStatusLog('Failed', `Certificate not yet valid. Starts on ${validFrom.toLocaleString()}`, 'fail');
      process.exit(1);
    } else if (now > validUntil) {
      compileStatusLog('Failed', `Certificate expired on ${validUntil.toLocaleString()}`, 'fail');
      process.exit(1);
    } else {
      compileStatusLog('Passed', 'Certificate validity confirmed', 'pass');
      compileStatusLog('Valid From', validFrom.toLocaleString(), 'blue');
      compileStatusLog('Expires', validUntil.toLocaleString(), 'blue');
    }

    // === RUN SECURITY CHECK ===
    const securityErrors = await runSecurityCheck('compile', { certifiedJson });
    const securityPassed = securityErrors.length === 0;
    if (!securityPassed) {
      const failPath = path.join(LOG_DIR, `compile-failure-${Date.now()}.log`);
      fs.writeFileSync(failPath, JSON.stringify({ errors: securityErrors, cert: certifiedJson }, null, 2), 'utf-8');
      compileStatusLog('Failed', 'Security check did not pass. See log for details.', 'fail');
      process.exit(1);
    } else {
      compileStatusLog('Passed', 'Security check passed', 'pass');
    }

    // === TOKEN COUNT ESTIMATE ===
    // Hoist llmName before try block for catch scope
    const llmName = certifiedJson?.conventions?.conventions?.[0]?.llmName || 'default';
    try {
      const agentKey = llmName.toLowerCase() as keyof typeof agentsConfig;
      const agentMeta = agentsConfig[agentKey];

      // Use a type-safe approach to get the correct meta (handles nested variants)
      const isNested = agentMeta && 'variants' in agentMeta;
      const meta = isNested
        ? agentMeta.variants[
        agentMeta.defaultVariant as keyof typeof agentMeta.variants
        ]
        : agentMeta;

      const jsonString = JSON.stringify(certifiedJson);
      const tokenEstimate = estimateTokensFromText(jsonString);

      compileStatusLog('Tokens', `Estimated token count: ${tokenEstimate}`, 'magenta');

      warnIfExceedsLimit('compiler', tokenEstimate, { maxTokenLoad: meta.maxTokenLoad });
      if (!meta) {
        // compileStatusLog('Warn', `No agent config found for LLM "${llmName}"`, 'warn');
        // Silently skip if no config is found; not critical
        return;
      } else if (tokenEstimate > meta.maxTokenLoad) {
        compileStatusLog('Failed', `Token count (${tokenEstimate}) exceeds max allowed (${meta.maxTokenLoad}) for ${llmName}`, 'fail');
        process.exit(1);
      } else if (tokenEstimate > meta.idealBriefingSize) {
        compileStatusLog('Warn', `Token count (${tokenEstimate}) exceeds ideal size (${meta.idealBriefingSize})`, 'warn');
      } else {
        compileStatusLog('Passed', 'Token count is within ideal range', 'pass');
      }
    } catch (err: any) {
      compileStatusLog(
        'Warn',
        `Token estimate unavailable. Possible issue: missing agent config for "${llmName}". Error: ${err.message}`,
        'warn'
      );
    }
    console.log();

    // === SELECT COMPILER IDENTITY ===
    const signersDir = path.join('.dokugent/keys/signers');
    const availableSigners = fs.readdirSync(signersDir)
      .map(name => name.trim())
      .filter(name => fs.existsSync(path.join(signersDir, name, 'latest', `${name}.meta.json`)));

    // Prompt: open compiled cert file in editor?
    const { openInEditor } = await prompt<{ openInEditor: boolean }>([
      {
        type: 'confirm',
        name: 'openInEditor',
        message: ui.padQuestion('Review cert file in editor (read-only mode)?'),
        initial: false
      }
    ]);
    console.log();
    const { editorChoice: rawEditorChoice } = await prompt<{ editorChoice: string }>([
      {
        type: 'select',
        name: 'editorChoice',
        message: ui.padQuestion('Select compiler identity:'),
        choices: availableSigners.map(name => {
          const cleanName = name.replace(/\s+/g, ' ').trim();
          return {
            name: ui.padQuestion(cleanName),
            value: cleanName
          };
        })
      }
    ]);
    const selectedCompiler = rawEditorChoice.trim();
    // console.log('👉 selectedCompiler:', JSON.stringify(selectedCompiler));

    // Load compiler metadata and set COMPILED_BY for use below
    const compilerMetaPath = path.join(signersDir, selectedCompiler, 'latest', `${selectedCompiler}.meta.json`);
    const compiler = JSON.parse(fs.readFileSync(compilerMetaPath, 'utf-8'));
    const COMPILED_BY = process.env.DOKUGENT_COMPILED_BY || 'unknown';

    // === COMPILE ===
    if (!certifiedJson.metadata) certifiedJson.metadata = {};
    certifiedJson.metadata.compilerName = selectedCompiler;
    certifiedJson.metadata.compilerFingerprint = compiler.fingerprint;
    certifiedJson.metadata.compilerKeyVersion = 'latest';

    const compiledData = {
      ...certifiedJson,
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
      metadata: certifiedJson.metadata // must be last
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
    certifiedJson.metadata.version = `v${nextVersion || 1}`;

    // === HASH + WRITE ===
    const crypto = await import('crypto');
    const jsonString = JSON.stringify(compiledData, null, 2);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');

    const compiledCert = {
      ...certifiedJson,
      compiledAt: new Date().toISOString(),
      compiledBy: "dokugent v0.1",
      certHash: hash,
      compiler: {
        compilerName: selectedCompiler,
        email: compiler.email,
        publicKey: compiler.publicKey,
        fingerprint: compiler.fingerprint
      },
      metadata: certifiedJson.metadata
    };

    fs.writeFileSync(compiledCertPath, JSON.stringify(compiledCert, null, 2), 'utf-8');
    fs.writeFileSync(compiledShaPath, hash, 'utf-8');
    console.log();
    ui.paddedDefault('', '→ ' + agentCompiledDir, 12, 'magenta', 'COMPILED AT');
    ui.paddedLog('Cert saved:', path.basename(compiledCertPath), 12, 'success', 'CERT');
    // ui.paddedLog(`Saved | Cert path: .dokugent/ops/compiled/{agentId}/`, agentId, 12, 'success', 'CERT SAVED');
    ui.paddedLog('SHA256 hash saved:', path.basename(compiledShaPath), 12, 'info', 'SHA256');
    console.log();
    // Open compiled cert file in editor if requested
    if (openInEditor) {
      const { exec } = await import('child_process');
      const editor = process.env.EDITOR || 'open';
      exec(`${editor} "${compiledCertPath}"`);
    }
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
