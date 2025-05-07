import fs from 'fs-extra';
import path from 'path';

export async function writeWithBackup(targetPath, contents) {
  const exists = await fs.pathExists(targetPath);
  if (exists) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const baseName = path.basename(targetPath, ext);
    const backupPath = path.join(dir, `${baseName}-${timestamp}${ext}`);

    await fs.ensureDir(dir);
    await fs.copy(targetPath, backupPath);
    console.log(`📦 Backup created at ${backupPath}`);
  }

  await fs.outputFile(targetPath, contents);
  return { status: exists ? 'backed_up' : 'written', path: targetPath };
}