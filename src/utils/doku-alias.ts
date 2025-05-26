/**
 * @file doku-alias.ts
 * @description Utility function to create or update symlink aliases for versioned folders.
 * Used to maintain a consistent reference point (e.g., `plan@latest`) for latest versions.
 *
 * 🔧 Available Utilities:
 * - `doku-alias.ts` – createAliasLink(): safely creates or updates versioned symlinks (e.g., `plan@latest`)
 */
import fs from 'fs-extra';
import path from 'path';

/**
 * Creates or updates a symlink alias pointing to a versioned folder.
 * Example: `.dokugent/plan@latest` → `.dokugent/plan@2025-05-15-1430`
 *
 * @param baseDir - Directory containing both the alias and the versioned target folder.
 * @param target - The versioned folder to point to (e.g., `plan@2025-05-15-1430`).
 * @param alias - Optional alias suffix (default is `latest`).
 * @returns {Promise<void>}
 */
export async function createAliasLink(
  baseDir: string,
  target: string,
  alias: string = 'latest'
): Promise<void> {
  const baseName = target.split('@')[0];
  const aliasPath = path.join(baseDir, `${baseName}@${alias}`);
  const targetPath = path.join(baseDir, target);

  try {
    await fs.remove(aliasPath); // Remove existing alias if present
    await fs.symlink(targetPath, aliasPath, 'dir');
    console.log(`🔗 Symlink updated: ${aliasPath} → ${targetPath}`);
  } catch (err) {
    console.error(`❌ Failed to create alias '${aliasPath}':`, err);
    throw err;
  }
}
