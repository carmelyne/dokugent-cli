import fs from 'fs-extra';
import path from 'path';

export async function updateSymlink(targetDir: string, name: string, versionedFolder: string): Promise<void> {
  const symlinkPath = path.join(targetDir, name);
  const targetPath = path.join(targetDir, versionedFolder);

  if (!(await fs.pathExists(targetPath))) {
    throw new Error(`Target folder '${versionedFolder}' does not exist.`);
  }

  try {
    await fs.remove(symlinkPath); // remove old symlink or folder
  } catch { }

  await fs.symlink(targetPath, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: ${name} → ${versionedFolder}`);
}