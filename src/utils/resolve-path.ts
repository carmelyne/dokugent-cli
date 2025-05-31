/**
 * @file resolve-path.ts
 * @description Resolves the correct directory for a versioned step identifier.
 * Supports fallback to latest available version or non-versioned base step folder.
 */
import fs from 'fs';
import path from 'path';

/**
 * Resolves the actual folder path of a versioned stepId.
 * 
 * Example: "myStep@20240513" → resolves to baseDir/myStep@20240513.
 * Falls back to the latest matching versioned folder or just `baseDir/myStep` if none found.
 *
 * @param baseDir - The directory where versioned steps are located.
 * @param stepIdWithVersion - A string like "myStep@20240513" or just "myStep".
 * @returns The resolved absolute path to the versioned or fallback directory.
 */
export function resolveVersionedPath(baseDir: string, stepIdWithVersion: string): string {
  const [stepId, version] = stepIdWithVersion.split('@');
  const versionedDir = version ? `${stepId}@${version}` : null;

  if (versionedDir) {
    const fullPath = path.resolve(baseDir, versionedDir);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  // fallback: get most recent matching folder
  const allEntries = fs.readdirSync(baseDir, { withFileTypes: true });
  const matching = allEntries
    .filter((e) => e.isDirectory() && e.name.startsWith(`${stepId}@`))
    .map((e) => e.name)
    .sort()
    .reverse(); // latest first by default string sort

  if (matching.length > 0) {
    return path.resolve(baseDir, matching[0]);
  }

  // fallback to non-versioned path
  return path.resolve(baseDir, stepId);
}
