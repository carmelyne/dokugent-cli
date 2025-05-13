import fs from "fs";
import path from "path";

/**
 * Resolves the actual folder path of a versioned stepId.
 * Example: "myStep@20240513" → resolves to baseDir/myStep@20240513
 * Falls back to latest version or baseDir/myStep if not found.
 *
 * @param {string} baseDir - The directory where versioned steps are located.
 * @param {string} stepIdWithVersion - A string like "myStep@20240513" or just "myStep".
 * @returns {string} - The resolved absolute path.
 */
export function resolveVersionedPath(baseDir, stepIdWithVersion) {
  const [stepId, version] = stepIdWithVersion.split("@");
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