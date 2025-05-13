import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const previewPath = path.join(process.cwd(), '.dokugent', 'preview');
const shaFilePath = path.join(previewPath, 'preview.sha256');

export async function previewLs() {
  console.log('📦 Preview Snapshot: .dokugent/preview\n');

  if (!(await fs.pathExists(previewPath))) {
    console.log('❌ No preview folder found. Run `dokugent preview` first.');
    return;
  }

  let expectedShas = {};
  if (await fs.pathExists(shaFilePath)) {
    const shaContent = await fs.readFile(shaFilePath, 'utf8');
    shaContent.trim().split('\n').forEach(line => {
      const [sha, filename] = line.trim().split(/\s{2,}/);
      if (sha && filename) expectedShas[filename] = sha;
    });
  }

  const entries = await fs.readdir(previewPath);
  let allGood = true;

  for (const entry of entries) {
    const fullPath = path.join(previewPath, entry);
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) continue;

    const isReadonly = !(stat.mode & 0o222);
    const buf = await fs.readFile(fullPath);
    const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
    const expectedSha = expectedShas[entry];

    const shaMatch = expectedSha === actualSha;
    const roMark = isReadonly ? '✓ read-only' : '✗ not read-only';
    const shaMark = expectedSha ? (shaMatch ? '✓ SHA match' : '✗ SHA mismatch') : '✗ SHA missing';

    if (!isReadonly || !shaMatch) allGood = false;

    console.log(`${(isReadonly && shaMatch ? '✅' : '⚠️')} ${entry} (${roMark}, ${shaMark})`);
  }

  if (Object.keys(expectedShas).length > 0) {
    console.log(`\n🧾 SHA file: preview.sha256 (${Object.keys(expectedShas).length} entries)`);
  }

  if (allGood) {
    console.log('\n🔒 All files intact and verified.');
  } else {
    console.log('\n❗Some preview files failed integrity or permission checks.');
  }
}
