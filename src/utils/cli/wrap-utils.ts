import { stdout } from 'process';
import wrapAnsi from 'wrap-ansi';

/**
 * Remove ANSI escape codes from a string to calculate actual display width
 */
export function stripAnsiCodes(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get terminal width, with fallback to 80 if not available
 */
export function getTerminalWidth(): number {
  return stdout.columns || 80;
}

/**
 * Wrap text with hanging indentation matching the prefix, in MkDocs style.
 * ANSI-safe, word-boundary wrapped, visually aligned for wrapped lines.
 */
export function wrapWithHangingIndent(
  text: string,
  prefix: string,
  maxWidth?: number,
  globalIndent: number = 0
): string {
  const terminalWidth = maxWidth || getTerminalWidth();
  const cleanPrefix = stripAnsiCodes(prefix);
  const fullPrefix = ' '.repeat(globalIndent) + prefix;
  const hangingIndent = ' '.repeat(globalIndent + cleanPrefix.length);

  return wrapAnsi(text, terminalWidth - hangingIndent.length, { hard: false })
    .split('\n')
    .map((line, i) => (i === 0 ? fullPrefix + line : hangingIndent + line))
    .join('\n');
}
