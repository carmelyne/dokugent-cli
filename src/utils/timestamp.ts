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

/**
 * Generates a compact timestamp slug in the format YYYYMMDD-HHMMSS.
 * Example: "20250629-074531"
 */
export function generateCompactTimestampSlug(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Generates a readable timestamp slug in the format YYYY-MM-DD_HH-MM-SS-ms.
 * Example: "2025-06-29_07-45-31-123"
 */
export function generateReadableTimestampSlug(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}-${ms}`;
}
