import fs from 'fs-extra';
import path from 'path';

/**
 * Safely writes contents to a file, creating a backup if the file already exists.
 *
 * If the target path exists, a timestamped backup is created in the same directory.
 *
 * @param targetPath - The full path to the file being written.
 * @param contents - The string contents to write into the file.
 * @returns An object with the write status and path.
 */
export async function writeWithBackup(
  targetPath: string,
  contents: string
): Promise<{ status: 'backed_up' | 'written'; path: string }> {
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
