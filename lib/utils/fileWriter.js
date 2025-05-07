import fs from 'fs-extra';
import path from 'path';

export async function writeWithBackup(targetPath, contents) {
  const exists = await fs.pathExists(targetPath);
  if (exists) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = path.resolve('.dokugent/.bak', timestamp);
    const relativePath = path.relative(path.resolve('.dokugent'), targetPath);
    const backupPath = path.join(baseDir, relativePath);

    await fs.ensureDir(path.dirname(backupPath));
    await fs.copy(targetPath, backupPath);
  }

  await fs.outputFile(targetPath, contents);
  return { status: exists ? 'backed_up' : 'written', path: targetPath };
}