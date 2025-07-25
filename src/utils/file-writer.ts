/**
 * @file file-writer.ts
 * @description Provides utility functions for safely writing files with automatic backups.
 * Ensures existing files are preserved with timestamped copies before overwriting.
 */
import fs from 'fs-extra';
import path from 'path';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';

/**
 * Safely writes contents to a file, creating a timestamped backup if the file already exists.
 *
 * Responsibilities:
 * - Checks if the target file exists.
 * - If it exists, creates a backup copy with an ISO-based timestamp in the same directory.
 * - Writes the new contents to the target file.
 *
 * @param targetPath - The full path to the file being written.
 * @param contents - The string contents to write into the file.
 * @returns {Promise<{ status: 'backed_up' | 'written'; path: string }>} An object indicating whether a backup was made and the final file path.
 */
export async function writeWithBackup(
  targetPath: string,
  contents: string
): Promise<{ status: 'backed_up' | 'written'; path: string }> {
  const exists = await fs.pathExists(targetPath);
  if (exists) {
    const dir = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const baseName = path.basename(targetPath, ext);
    const backupPath = path.relative(process.cwd(), path.join(dir, `${baseName}.bak${ext}`));

    await fs.ensureDir(dir);
    await fs.copy(targetPath, backupPath);
    // console.log(`\n📦 Backup created at\n   ${backupPath}`);
    paddedLog('File', backupPath, PAD_WIDTH, 'orange', 'BACKUP');
  }

  await fs.outputFile(targetPath, contents);
  return { status: exists ? 'backed_up' : 'written', path: targetPath };
}
