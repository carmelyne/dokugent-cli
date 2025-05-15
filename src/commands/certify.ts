import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';
import { getTimestamp } from '../utils/timestamp';

export async function runCertifyCommand() {
  const agent = process.argv[3];
  if (!agent) {
    console.log('❌ Please specify an agent: dokugent certify <agent>');
    return;
  }

  // Check for at least one private key in .dokugent/keys/
  const keysDir = path.join(process.cwd(), '.dokugent/keys');
  const keyFiles = (await fs.pathExists(keysDir)) ? await fs.readdir(keysDir) : [];
  const hasPrivateKey = keyFiles.some(f => f.endsWith('.private.pem'));
  if (!hasPrivateKey) {
    console.log('❌ No private key found. Run `dokugent keygen` first to create a signing key.');
    return;
  }

  const previewDir = path.resolve(process.cwd(), '.dokugent/preview');
  const specsPath = path.join(previewDir, 'specs', agent);
  const versionTag = getTimestamp();
  const outputDir = path.join(process.cwd(), '.dokugent/certified', `${versionTag}-${agent}`);
  const symlinkPath = path.join(process.cwd(), '.dokugent/certified/latest');

  const shaFile = path.join(previewDir, 'preview.sha256');
  const outputSha = path.join(outputDir, `${agent}.cert.sha256`);

  const requiredPaths = [specsPath, shaFile];
  for (const p of requiredPaths) {
    if (!(await fs.pathExists(p))) {
      console.log(`❌ Required file or folder not found: ${p}`);
      return;
    }
  }

  await fs.ensureDir(outputDir);
  await fs.copy(specsPath, path.join(outputDir, 'specs', agent));
  await fs.copy(shaFile, outputSha);

  const shaContent = await fs.readFile(shaFile, 'utf8');
  const sha256 = createHash('sha256').update(shaContent).digest('hex');
  await fs.writeFile(
    path.join(outputDir, 'certification.md'),
    `# Certification for ${agent}\n\n- SHA256: ${sha256}\n- Timestamp: ${new Date().toISOString()}\n- Version: ${versionTag}\n`
  );
  // ✅ Write logs and reports
  const logsDir = path.join(process.cwd(), '.dokugent/logs');
  const reportsDir = path.join(process.cwd(), '.dokugent/reports');
  await fs.ensureDir(logsDir);
  await fs.ensureDir(reportsDir);

  const logMessage = `🧾 Certification Log for ${agent} [${versionTag}]\n- SHA256: ${sha256}\n- Time: ${new Date().toISOString()}\n`;
  await fs.writeFile(path.join(logsDir, `certify@${versionTag}.log`), logMessage, 'utf8');

  await fs.writeJson(
    path.join(reportsDir, `certify@${versionTag}.json`),
    {
      agent,
      version: versionTag,
      sha256,
      certified_at: new Date().toISOString()
    },
    { spaces: 2 }
  );

  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(outputDir, symlinkPath, 'dir');

  console.log(`✅ Agent "${agent}" certified successfully.`);
  console.log(`📁 Certified folder: ${outputDir}`);
  console.log(`🔗 Symlink updated: certified/latest → ${outputDir}`);
}