/****
 * @file certify.ts
 * @description Validates a previewed agent spec, signs it with a private key,
 * and creates a certified output directory containing all certified files,
 * metadata, SHA256 signature, and audit logs.
 */
import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';
import { getTimestamp } from '../utils/timestamp';

/**
 * Runs the Dokugent certification process.
 *
 * Responsibilities:
 * - Resolves preview symlink to determine versionTag.
 * - Copies and renames agent specs and preview files into a flat structure.
 * - Signs the bundle using SHA256 and prepares a metadata summary.
 * - Writes cert logs and JSON reports.
 * - Updates symlink `.dokugent/certified/latest` to the new cert folder.
 *
 * @param agentArg Optional agent name override (defaults to first found in preview)
 * @returns {Promise<void>}
 */
export async function runCertifyCommand(agentArg?: string) {
  // Resolve preview/latest symlink and agent list
  const previewBase = path.join(process.cwd(), '.dokugent', 'preview');
  const previewLatest = await fs.realpath(path.join(previewBase, 'latest'));
  const specsRoot = path.join(previewLatest, 'specs');
  const agents = await fs.pathExists(specsRoot) ? await fs.readdir(specsRoot) : [];

  if (agents.length === 0) {
    console.log('❌ No agent folder found in preview specs.');
    return;
  }

  const agent = agentArg || agents[0];
  if (agent === 'whoami') {
    console.log(`\n🤖 "I'm certified... but only if you catch me!" 😭🎯\n`);
  }

  // Validate presence of keys and input files
  // Check for at least one private key in .dokugent/keys/
  const keysDir = path.join(process.cwd(), '.dokugent/keys');
  const keyFiles = (await fs.pathExists(keysDir)) ? await fs.readdir(keysDir) : [];
  const hasPrivateKey = keyFiles.some(f => f.endsWith('.private.pem'));
  if (!hasPrivateKey) {
    console.log('❌ No private key found. Run `dokugent keygen` first to create a signing key.');
    return;
  }

  const specsPath = path.join(previewLatest, 'specs', agent);
  const versionTag = path.basename(previewLatest);
  const outputDir = path.join(process.cwd(), '.dokugent/certified', `${versionTag}-${agent}`);
  const symlinkPath = path.join(process.cwd(), '.dokugent/certified/latest');

  const shaFile = path.join(previewLatest, 'preview.sha256');
  const outputSha = path.join(outputDir, `${agent}.cert.sha256`);

  const requiredPaths = [specsPath, shaFile];
  for (const p of requiredPaths) {
    if (!(await fs.pathExists(p))) {
      console.log(`❌ Required file or folder not found: ${p}`);
      return;
    }
  }

  await fs.ensureDir(outputDir);
  await fs.copy(specsPath, outputDir, { overwrite: true });

  // Flatten and rename certified files
  const specFilesToCertify = ['agent-spec.json', 'tool-list.json'].map(f => path.join(outputDir, f));

  for (const src of specFilesToCertify) {
    const certName = `${agent}-${path.basename(src).replace('.json', '.cert.json')}`;
    const dest = path.join(outputDir, certName);
    if (await fs.pathExists(src)) {
      await fs.move(src, dest, { overwrite: true });
    }
  }

  await fs.copy(shaFile, outputSha, { overwrite: true });

  // ✅ Copy all preview-*.json and preview-*.sha256 files into the root of the certification folder:
  const previewFiles = await fs.readdir(previewLatest);
  for (const file of previewFiles) {
    if (file.startsWith('preview-') && (file.endsWith('.json') || file.endsWith('.sha256'))) {
      const src = path.join(previewLatest, file);
      const baseName = file.replace(/\.json$/, '').replace(/\.sha256$/, '');
      const destName = file.endsWith('.sha256') ? `${baseName}.cert.sha256` : `${baseName}.cert.json`;
      await fs.copy(src, path.join(outputDir, destName), { overwrite: true });
    }
  }

  // Generate SHA hash from preview.sha256
  const shaContent = await fs.readFile(shaFile, 'utf8');
  const sha256 = createHash('sha256').update(shaContent).digest('hex');
  // ✅ Replace the `certification.md` output with JSON:
  await fs.writeJson(
    path.join(outputDir, `${agent}.cert.json`),
    {
      agent,
      sha256,
      timestamp: new Date().toISOString(),
      version: versionTag,
      files: await fs.readdir(outputDir)
    },
    { spaces: 2, flag: 'w' }
  );
  // Write cert metadata, logs, and reports
  const logsDir = path.join(process.cwd(), '.dokugent/logs', 'certify');
  const reportsDir = path.join(process.cwd(), '.dokugent/reports', 'certify');
  await fs.ensureDir(logsDir);
  await fs.ensureDir(reportsDir);

  const logMessage = `🧾 Certification Log for ${agent} [${versionTag}]\n- SHA256: ${sha256}\n- Time: ${new Date().toISOString()}\n`;
  await fs.writeFile(path.join(logsDir, `certify@${versionTag}.log`), logMessage, { encoding: 'utf8', flag: 'w' });

  await fs.writeJson(
    path.join(reportsDir, `certify@${versionTag}.json`),
    {
      agent,
      version: versionTag,
      sha256,
      certified_at: new Date().toISOString()
    },
    { spaces: 2, flag: 'w' }
  );

  // Update certified/latest symlink
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(outputDir, symlinkPath, 'dir');

  const relativeOutput = path.relative(process.cwd(), outputDir);
  console.log(`\n📝  \x1b[1mDokugent Certification Summary:\x1b[0m`);
  console.log(`\n✅  Agent \x1b[1m"${agent}"\x1b[0m certified successfully!\n`);
  console.log(`🔐  Certified folder:\n   ${relativeOutput}`);
  console.log(`\n🌳  Symlink updated:\n   certified/latest → ${relativeOutput}\n`);
}
