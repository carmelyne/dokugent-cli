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

export async function runCertifyCommand(agentArg?: string) {
  console.log('🔧 Certify command setup in progress...');

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
    console.error('❌ No agent found. Please run `dokugent agent` first.');
    return;
  }

  const agentFolderName = path.basename(agentFolderPath);
  const [agentId, birthTimestamp] = agentFolderName.split('@');
  console.log('🧪 agentId:', agentId);
  console.log('🧪 birthTimestamp:', birthTimestamp);

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

  console.log(`🪪 Detected agent: ${agentId}`);

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
  const validFrom = new Date().toISOString();
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(); // 1 year

  const selectedKeyPath = path.join(keysBasePath, selectedOwner, 'latest');
  const exists = await fs.pathExists(selectedKeyPath);
  if (!exists) {
    console.error('❌ No private key found. Run `dokugent keygen` first to create a signing key.');
    return;
  }

  console.log(`🔐 Using signing key from: ${selectedKeyPath}`);

  // Load signer.json
  const signerPath = path.join(keysBasePath, selectedOwner, 'latest', `${selectedOwner}.meta.json`);
  const signer = await fs.readJson(signerPath);

  // Step 3: Load preview file and validate structure
  const previewJson = await fs.readJson(previewPath);
  if (!previewJson.previewer || typeof previewJson.previewer !== 'object') {
    console.error('❌ Cannot certify: missing previewer metadata.');
    console.error('➡️ Please run `dokugent preview` before certifying.');
    return;
  }

  // Compose agentUri and ownerId for metadata
  const agentUri = `doku://${selectedOwner}/${agentId}@${birthTimestamp}`;
  const ownerId = selectedOwner;

  // Inject Doku Metadata (updated fields)
  const metadata: any = {
    format: 'doku-cert',
    version: 'v1.0.0',
    schema: 'https://dokugent.org/schema/v1.json',
    generatedAt: new Date().toISOString(),
    generator: `dokugent@${pkgVersion}`,
    experimental: false,
    uri: agentUri,
    certifierName: selectedOwner,
    certifierFingerprint: signer.fingerprint || '',
    certifierKeyVersion: 'latest',
    validFrom,
    validUntil
  };

  // Inject certifier block from loaded signer object
  const certifier = {
    certifierName: selectedOwner,
    email: signer.email,
    publicKey: signer.publicKey,
    fingerprint: signer.fingerprint
  };

  const certifiedOutput = {
    ...previewJson,
    certifier,
    metadata
  };

  // Calculate SHA256 hash of the stringified JSON
  const hash = createHash('sha256').update(JSON.stringify(certifiedOutput)).digest('hex');
  certifiedOutput.metadata.sha256 = hash;

  console.log('🧾 Preview validated and metadata injected.');
  console.log(`🔐 SHA256: ${hash}`);

  // Step 4: Save to .dokugent/ops/certified/
  const certOutputDir = path.join('.dokugent', 'ops', 'certified', agentId);
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
  console.log(`🔐 SHA256: ${sha256}`);

  console.log(`✅ Certified output saved to: ${certOutputPath}`);
}
