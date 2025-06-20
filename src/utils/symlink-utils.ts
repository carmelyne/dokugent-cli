/**
 * @file symlink-utils.ts
 * @description Utility function to create or update symlinks pointing to versioned folders.
 * Ensures reliable aliasing (e.g., `latest`) to simplify downstream workflows.
 */
import fs from 'fs-extra';
import path from 'path';

/**
 * Updates or creates a symlink to a specific versioned folder.
 *
 * Responsibilities:
 * - Verifies that the versioned folder exists.
 * - Removes the existing symlink or folder with the alias name if present.
 * - Creates a new symlink pointing to the versioned target.
 *
 * @param targetDir - The parent directory where both the alias and versioned folder reside.
 * @param name - The name of the symlink alias to create or update (e.g., 'latest').
 * @param versionedFolder - The folder name to which the symlink should point.
 * @returns {Promise<void>}
 */
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

/**
 * Resolves the real path of a symlink inside the .dokugent/data directory.
 * Useful for getting the actual versioned folder behind a label like 'latest' or 'current'.
 *
 * @param name - The subdirectory inside .dokugent/data to resolve (e.g., 'agents', 'criteria')
 * @returns {Promise<string>} The resolved path.
 */
export async function resolveSymlinkedPath(name: string): Promise<string> {
  const baseDir = path.join('.dokugent', 'data', name);
  const symlinkPath = path.resolve(baseDir);

  if (!(await fs.pathExists(symlinkPath))) {
    throw new Error(`Symlink path "${symlinkPath}" not found.`);
  }

  const realPath = await fs.realpath(symlinkPath);
  return realPath;
}
