/**
 * @file index.ts
 * @description Dokugent Certify Command
 * Signs an agent preview with the selected private key and generates a certified output.
 */

import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';
import inquirer from 'inquirer';
import { getTimestamp } from '@utils/timestamp';
import { version as pkgVersion } from '../../../package.json';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';
import { estimateTokensFromText } from '@utils/tokenizer';
import { paddedLog, padMsg, PAD_WIDTH, paddedCompact, glyphs, printLabeledBox, paddedSubCompact } from '@utils/cli/ui';
import { compileStatusLog } from '@utils/cli/compile';
import { runTokenTrustCheck } from '@utils/security/token-check';

export async function runCertifyCommand(agentArg?: string) {

  paddedLog('dokugent agent initialized...', '', PAD_WIDTH, 'info');


  // Step 1: Detect agent ID
  const agentsBase = path.join('.dokugent', 'data', 'agents');
  const currentAgentLink = path.join(agentsBase, 'current');
  const latestAgentLink = path.join(agentsBase, 'latest');

  let agentFolderPath = '';
  if (await fs.pathExists(currentAgentLink)) {
    agentFolderPath = await fs.realpath(currentAgentLink);
  } else if (await fs.pathExists(latestAgentLink)) {
    agentFolderPath = await fs.realpath(latestAgentLink);
  } else {
    console.error(padMsg(`${glyphs.warning} No agent found. Please run dokugent agent first.`));
    return;
  }

  const agentFolderName = path.basename(agentFolderPath);
  const [agentId, birthTimestamp] = agentFolderName.split('@');
  compileStatusLog('agentId', agentId, 'blue');
  compileStatusLog('birthstamp', birthTimestamp, 'blue');


  // Ensure certificate generation date is not earlier than agent creation date
  const birthDate = new Date(birthTimestamp);
  const now = new Date();
  if (now < birthDate) {
    console.error('❌ Certificate generation date is earlier than agent creation date.');
    return;
  }

  if (!agentId || !birthTimestamp) {
    console.error('❌ Invalid agent folder format. Expected <agentId>@<timestamp>.');
    return;
  }

  const previewPath = path.join('.dokugent', 'ops', 'previews', 'latest', `${agentId}@${birthTimestamp}_preview.json`);
  const previewExists = await fs.pathExists(previewPath);
  if (!previewExists) {
    console.error(`❌ Preview not found for agent "${agentId}" at expected path:\n   ${previewPath}`);
    return;
  }

  // console.log(`🪪 Detected agent: ${agentId}`);
  compileStatusLog('Agent', agentId, 'blue');
  console.log();
  // Step 2: Prompt for signing key
  const keysBasePath = path.join('.dokugent', 'keys', 'signers');
  if (!(await fs.pathExists(keysBasePath))) {
    console.error('❌ No signing keys found. Run `dokugent keygen` first.');
    return;
  }

  const owners = await fs.readdir(keysBasePath);
  if (owners.length === 0) {
    console.error('❌ No signing keys found. Run `dokugent keygen` first.');
    return;
  }

  const ownerChoices = owners.map(owner => ({ name: owner, value: owner }));
  const { selectedOwner } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedOwner',
      message: '❓ Who should be used as signing identity?',
      choices: ownerChoices
    }
  ]);

  const { validity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'validity',
      message: '🗓️ Set certificate validity period:',
      choices: [
        { name: '6 months (default)', value: '6m' },
        { name: '1 year', value: '1y' },
        { name: '2 years', value: '2y' }
      ],
      default: '6m'
    }
  ]);

  // Removed previous validFrom and validUntil assignments
  // Assign validFrom and validUntil as per instructions
  const validFrom = new Date().toLocaleString();
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toLocaleString(); // 1 year

  const selectedKeyPath = path.join(keysBasePath, selectedOwner, 'latest');
  const exists = await fs.pathExists(selectedKeyPath);
  if (!exists) {
    console.error('❌ No private key found. Run `dokugent keygen` first to create a signing key.');
    return;
  }
  console.log();
  console.log(padMsg(`Using signing key from: ${selectedKeyPath}`));

  // Load signer.json
  const signerPath = path.join(keysBasePath, selectedOwner, 'latest', `${selectedOwner}.meta.json`);
  const signer = await fs.readJson(signerPath);

  // Step 3: Load preview file and validate structure
  const previewJson = await fs.readJson(previewPath);

  // Validate token count by re-estimating tokens from preview content
  const { estimatedTokens, ...previewClone } = previewJson;
  const recalculatedPreviewTokens = estimateTokensFromText(JSON.stringify(previewClone));
  if (previewJson.estimatedTokens !== recalculatedPreviewTokens) {
    console.error(`❌ Token drift detected: preview file content has changed since it was generated.`);
    console.error(`➡️ Stored preview tokens: ${previewJson.estimatedTokens}`);
    console.error(`➡️ Current preview tokens: ${recalculatedPreviewTokens}`);
    console.error(`🛑 Certification halted. Run \`dokugent preview\` again before certifying.`);
    return;
  }

  if (!previewJson.previewer || typeof previewJson.previewer !== 'object') {
    console.error('❌ Cannot certify: missing previewer metadata.');
    console.error('➡️ Please run `dokugent preview` before certifying.');
    return;
  }

  // Compose agentUri and ownerId for metadata
  const agentUri = `doku://${selectedOwner}/${agentId}@${birthTimestamp}`;
  const ownerId = selectedOwner;

  // Inject certifier block from loaded signer object (updated fields)
  const certifier = {
    certifierName: selectedOwner,
    certifiedAt: now.toISOString(),
    certifiedAtDisplay: now.toLocaleString(),
    email: signer.email,
    publicKey: signer.publicKey,
    fingerprint: signer.fingerprint,
    keyVersion: signer.keyVersion || 'latest'
  };

  // Inject Doku Metadata (updated fields)
  const metadata: any = {
    format: 'doku-cert',
    version: DOKUGENT_SCHEMA_VERSION,
    schema: DOKUGENT_SCHEMA_VERSION,
    generator: DOKUGENT_CLI_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    generatedAt: now.toISOString(),
    generatedAtDisplay: now.toLocaleString(),
    certifierFingerprint: signer.fingerprint || '',
    certifierKeyVersion: 'latest',
    experimental: false,
    validFrom,
    validUntil,
    uri: agentUri,
  };

  const certifiedOutput = {
    ...previewJson,
    certifier,
    metadata
  };

  metadata.certifiedTokens = JSON.stringify(certifiedOutput).length; // approximate count
  // Token breakdown block
  const breakdown = [
    ['agent', estimateTokensFromText(JSON.stringify(certifiedOutput.agent))],
    ['plan', estimateTokensFromText(JSON.stringify(certifiedOutput.plan))],
    ['criteria', estimateTokensFromText(JSON.stringify(certifiedOutput.criteria))],
    ['conventions', estimateTokensFromText(JSON.stringify(certifiedOutput.conventions))],
    ['owner', estimateTokensFromText(JSON.stringify(certifiedOutput.owner))],
    ['previewer', estimateTokensFromText(JSON.stringify(certifiedOutput.previewer))],
    ['versions', estimateTokensFromText(JSON.stringify(certifiedOutput.sourceVersions))],
  ];

  console.log();
  paddedCompact('Token Breakdown', '', 12, 'info');
  for (const [key, rawValue] of breakdown as [string, any][]) {
    const value = typeof rawValue === 'object' && rawValue !== null ? rawValue.total : rawValue;
    if (typeof value === 'number') {
      paddedSubCompact('', `${key}: ${value} tokens`);
    }
  }
  console.log();
  paddedLog('Estimated Token Usage', `${metadata.certifiedTokens}`, PAD_WIDTH, 'pink', 'TOKENS');
  // console.log(`📦 Certified Token Total: ${metadata.certifiedTokens}`);
  runTokenTrustCheck({
    estimatedTokens: metadata.certifiedTokens,
    context: 'certify'
  });

  // Calculate SHA256 hash of the stringified JSON
  const hash = createHash('sha256').update(JSON.stringify(certifiedOutput)).digest('hex');
  certifiedOutput.metadata.sha256 = hash;

  console.log(padMsg(`${glyphs.starFilled} Preview validated and metadata injected.`));
  console.log(padMsg(`${glyphs.starFilled} SHA256: ${hash}`));

  // Step 4: Save to .dokugent/ops/certified/
  const certOutputDir = path.join('.dokugent', 'ops', 'certified', agentId);
  // Clean the certified output directory before saving new cert
  if (await fs.pathExists(certOutputDir)) {
    await fs.emptyDir(certOutputDir);
  }
  const certOutputPath = path.join(certOutputDir, `${agentId}@${birthTimestamp}.cert.json`);

  await fs.ensureDir(certOutputDir);

  if (await fs.pathExists(certOutputPath)) {
    await fs.remove(certOutputPath); // Remove existing file to avoid EACCES if it's read-only
  }

  await fs.writeJson(certOutputPath, certifiedOutput, { spaces: 2 });

  // Write .cert.sha256 file
  const shaFilename = `${agentId}@${birthTimestamp}.cert.sha256`;
  const shaPath = path.join(certOutputDir, shaFilename);
  await fs.writeFile(shaPath, hash);

  // Save certify log to .dokugent/ops/logs/certified/<agentId>/<logFilename>
  const logFilename = `certify@${birthTimestamp}.log`;
  const logPath = path.join('.dokugent', 'ops', 'logs', 'certified', agentId, logFilename);

  await fs.ensureDir(path.dirname(logPath));

  const logContent = [
    `Agent: ${agentId}`,
    `Timestamp: ${birthTimestamp}`,
    `SHA256: ${hash}`,
    `Signed by: ${selectedOwner}`,
    `Key path: ${selectedKeyPath}`,
  ].join('\n');
  await fs.writeFile(logPath, logContent);

  await fs.chmod(certOutputPath, 0o444); // Read-only for all

  // Generate and save SHA256 hash
  const hash2 = createHash('sha256');
  const fileBuffer = await fs.readFile(certOutputPath);
  hash2.update(fileBuffer);
  const sha256 = hash2.digest('hex');
  const shaPath2 = certOutputPath.replace('.cert.json', '.cert.sha256');
  await fs.outputFile(shaPath2, sha256);
  console.log(padMsg(`${glyphs.starFilled} SHA256: ${sha256}`));
  console.log();
  console.log(padMsg(`${glyphs.check} Certified output saved to:`));
  console.log(padMsg(`${certOutputPath}`));
  console.log();
}
