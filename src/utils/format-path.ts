

import path from 'path';

/**
 * Formats a given absolute or relative path as a relative path from the current working directory.
 * Ensures output avoids leaking full system paths.
 *
 * @param targetPath Absolute or relative path to normalize.
 * @returns Relative path from the process's working directory.
 */
export function formatRelativePath(targetPath: string): string {
  return path.relative(process.cwd(), path.resolve(targetPath));
}
