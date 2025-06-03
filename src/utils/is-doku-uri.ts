/**
 * Checks if a given string is a valid doku:// URI.
 */
export function isDokuUri(input: string): boolean {
  return input.startsWith('doku://');
}
