/**
 * @file timestamp.ts
 * @description Timestamp-based versioning utilities used across Dokugent for aliasing,
 * folder naming, backups, and file history tracking.
 */

/**
 * Generates a version-friendly timestamp string in the format YYYY-MM-DD-HHMM.
 * Suitable for filenames, symlinks, and CLI-visible identifiers.
 *
 * @returns {string} A timestamp string, e.g. "2025-05-15-1430"
 */
export function getTimestamp(): string {
  const now = new Date();
  const iso = now.toISOString(); // "2025-05-18T05:20:33.456Z"
  return iso.replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
}

/**
 * Appends a version timestamp to a given base string using '@' notation.
 *
 * @param base - The base name to version (e.g., "plan", "compiled")
 * @returns {string} A versioned string in the format "base@YYYY-MM-DD-HHMM"
 */
export function appendTimestamp(base: string): string {
  return `${base}@${getTimestamp()}`;
}
