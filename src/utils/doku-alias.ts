import fs from 'fs-extra';
import path from 'path';

/**
 * Creates or updates a symlink alias pointing to a versioned folder.
 * Example: .dokugent/plan@latest → .dokugent/plan@2025-05-15-1430
 *
 * @param baseDir - The directory containing both the alias and target versioned folder.
 * @param target - The name of the versioned target folder (e.g., "plan@2025-05-15-1430").
 * @param alias - The alias suffix to use (default is "latest").
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
