import chalk from 'chalk';
import boxen from 'boxen';
import ora, { Ora } from 'ora';
import wrapAnsi from 'wrap-ansi';

// Define shared types and constants for padded logging functions
type LogLevel = 'success' | 'info' | 'warn' | 'error' | 'blue' | 'orange' | 'pink' | 'purple' | 'magenta';

const PADDED_LOG_COLOR_MAP: Record<LogLevel, chalk.Chalk> = {
  success: chalk.green,
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,
  blue: chalk.hex('#1E90FF'),
  orange: chalk.hex('#FFA500'),
  pink: chalk.hex('#FF69B4'),
  purple: chalk.hex('#8A2BE2'),
  magenta: chalk.magenta,
};

// Like paddedCompact, but omits dim text (no dim indent for value line)
// Supports both 2-argument shorthand and full-argument signature with smart fallbacks.
export function paddedDefault(
  label: string,
  value: string,
  arg3?: number | LogLevel | string,
  arg4?: LogLevel | string,
  arg5?: string
): void {
  let width: number = PAD_WIDTH;
  let level: LogLevel = 'info';
  let labelPrefix: string | undefined;

  if (typeof arg3 === 'number') {
    width = arg3;
    if (typeof arg4 === 'string' && PADDED_LOG_COLOR_MAP[arg4 as LogLevel]) {
      level = arg4 as LogLevel;
      labelPrefix = arg5;
    }
  } else if (typeof arg3 === 'string') {
    if (PADDED_LOG_COLOR_MAP[arg3 as LogLevel]) {
      level = arg3 as LogLevel;
      labelPrefix = arg4 as string;
    } else {
      labelPrefix = arg3;
    }
  }

  const prefixText = labelPrefix ? labelPrefix.padEnd(width) : level.toUpperCase().padEnd(width);
  const prefix = PADDED_LOG_COLOR_MAP[level](prefixText);
  const colon = label.trim() !== '' ? ': ' : '';
  console.log(`${prefix}${label}${colon}${chalk.white(value)}`);
}

function verticalSpace(lines = 1): void {
  process.stdout.write('\n'.repeat(lines));
}

// Interface for managing step status, primarily for the Step Logger
export interface StepStatus {
  spinner: Ora;
  originalText: string;
}

export const ui = {
  info: (msg: string) => console.log(chalk.blueBright(`INFO     `.padEnd(13) + msg)),
  success: (msg: string) => console.log(chalk.green(`SUCCESS  `.padEnd(13) + msg)),
  warn: (msg: string) => console.warn(chalk.yellow(`WARNING  `.padEnd(13) + msg)),
  error: (msg: string) => console.error(chalk.red(`ERROR    `.padEnd(13) + msg)),
  headline: (msg: string) => console.log(chalk.bold.underline(`\n🔹 ${msg}`)),

  box: (
    msg: string,
    color: string = 'green',
    align: 'left' | 'center' | 'right' = 'center',
    borderStyle: 'single' | 'round' = 'round'
  ) => {
    // Map custom color names to hex codes for boxen
    const colorMap: Record<string, string> = {
      blue: '#1E90FF',
      orange: '#FFA500',
      pink: '#FF69B4',
      purple: '#8A2BE2',
      magenta: '#FF00FF',
    };
    return console.log(
      boxen(msg, {
        padding: 1,
        borderColor: (colorMap[color] ? colorMap[color] : color),
        align,
        borderStyle,
      })
    );
  },

  spinner: (text: string) => ora(text).start(),

  link: (label: string, url: string) => {
    console.log(terminalLink(label, url)); // Use the local terminalLink function
  },
  divider: (
    char: string = '─',
    length: number = process.stdout.columns || 60,
    color: chalk.Chalk = chalk.gray // Allow custom color for the divider
  ) => console.log(color(char.repeat(length))),

  // Step Logger methods
  stepStart: (text: string): StepStatus => {
    const spinner = ora({
      text: text, // Ora will show spinner + this text
      color: 'cyan', // Color of the spinner itself (ora default is cyan)
      // spinner: 'dots' // Optionally specify spinner type like 'dots', 'moon', etc.
    }).start();
    return { spinner, originalText: text };
  },

  stepSuccess: (step: StepStatus, successText?: string) => {
    // Ora will use its default success symbol (e.g., a green checkmark)
    step.spinner.succeed(chalk.green(successText || step.originalText));
  },

  stepFail: (step: StepStatus, failText?: string, errorDetails?: string) => {
    // Ora will use its default fail symbol (e.g., a red cross)
    let message = chalk.red(failText || step.originalText);
    if (errorDetails) {
      const indent = '  '; // Two spaces for indentation
      const formattedErrorDetails = errorDetails
        .split('\n')
        .map(line => `${indent}${chalk.gray(line)}`)
        .join('\n');
      message += `\n${formattedErrorDetails}`;
    }
    step.spinner.fail(message);
  },

  stepInfo: (text: string) => {
    console.log(`${chalk.blue(glyphs.info)} ${chalk.dim(text)}`); // Use info glyph and dim text
  },
};

// Prints a table with colored headers and rows.
export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((_, colIndex) => {
    const allRows = [headers, ...rows];
    return Math.max(...allRows.map(row => row[colIndex]?.length || 0)) + 2;
  });

  const formatRow = (cols: string[], colorFns: ((txt: string) => string)[] = []) =>
    '| ' +
    cols
      .map((col, i) => {
        const text = col.padEnd(colWidths[i], ' ');
        return colorFns[i] ? colorFns[i](text) : text;
      })
      .join(' | ') +
    ' |';

  const dividerRow = colWidths.map(w => '-'.repeat(w));

  console.log(chalk.gray(formatRow(headers, headers.map(() => chalk.cyan))));
  console.log(chalk.gray(formatRow(dividerRow)));
  rows.forEach(row => {
    console.log(formatRow(row, row.map((_, i) => (i === 0 ? chalk.yellow : chalk.green))));
  });
}

export function menuList(items: { id: string; name: string; org: string; region: string }[]): void {
  console.log(chalk.yellow.bold('\nSelect a project:\n'));
  items.forEach((item, i) => {
    console.log(`${chalk.bold(String(i + 1))}. ${chalk.cyan(item.name)} (${item.org}, ${item.region})`);
  });
  console.log(chalk.gray.dim('\n↑/k up • ↓/j down • / filter • q quit • ? more\n'));
}

// Usage
// paddedLog('hash saved', shaPath, 'info', 'SHA256');
// paddedLog('Compile log saved', logPath, 'info', '📝');
// paddedLog('Saved as', certPath, 'success', '💾');

export function paddedLog(
  label: string,
  value: string,
  width: number = 12,
  level: LogLevel = 'info',
  labelPrefix?: string
): void {
  const prefixText = labelPrefix ? labelPrefix.padEnd(width) : level.toUpperCase().padEnd(width);
  const prefix = PADDED_LOG_COLOR_MAP[level](prefixText);
  const indent = chalk.dim(''.padEnd(width));

  const wrapped = wrapAnsi(value, process.stdout.columns - width, { hard: false });
  const lines = wrapped.split('\n');

  verticalSpace(1);
  console.log(`${prefix}${label}`);
  for (const line of lines) {
    console.log(`${indent}${chalk.white(line)}`);
  }
}

export function paddedCompact(
  label: string,
  value: string,
  width: number = 12,
  level: LogLevel = 'info',
  labelPrefix?: string
): void {
  const prefixText = labelPrefix ? labelPrefix.padEnd(width) : level.toUpperCase().padEnd(width);
  const prefix = PADDED_LOG_COLOR_MAP[level](prefixText);
  const indent = chalk.dim(''.padEnd(width));

  console.log(`${prefix}${label}`);
  console.log(`${indent}${chalk.white(value)}`);
}

export function paddedSub(label: string, value: string): void {
  const width = 12;
  const prefix = chalk.dim(''.padEnd(width));
  const lines = value.split('\n');

  verticalSpace(); // top margin

  if (label) {
    console.log(`${prefix}${chalk.gray(label)}`);
    // verticalSpace(1);
  }

  if (lines.length) {
    lines.forEach(line => {
      if (line.trim()) console.log(`${prefix}${chalk.white(line)}`);
    });
  }

  verticalSpace(); // bottom margin
}

// Formats a padded message (label + value) as a string, with optional color and prefix.
export const PAD_WIDTH = 12;

export function padMsg(
  msg: string,
  width: number = PAD_WIDTH,
  useNonBreakingSpace: boolean = false
): string {
  const char = useNonBreakingSpace ? '\u00A0' : ' ';
  return char.repeat(width) + msg;
}

// Common glyphs/characters for semantic CLI UI
export const glyphs = {
  check: '✔',
  cross: '✖',
  arrowRight: '→',
  arrowDouble: '⇒',
  arrowLoop: '⇨',
  bullet: '•',
  play: '‣',
  square: '▪',
  circle: '◦',
  starFilled: '★',
  starEmpty: '☆',
  cornerTopLeft: '╭',
  cornerBottomLeft: '╰',
  cornerTopRight: '╮',
  cornerBottomRight: '╯',
  verticalBar: '│',
  info: 'ℹ',
  folder: 'ℹ',
  symlink: 'ℹ',
  warning: '⚠',
  alert: '‼',
  ruleHeavy: '━',
  ruleLight: '─',
  // Added glyphs
  linkAscii: '://',
  infoInfo: 'ii',
  protoHttp: 'h://',
  protoDoku: 'd://',
};

// Render a clickable terminal link (only works in supported terminals like iTerm2 or VSCode)
export function terminalLink(label: string, url: string): string {
  return `\u001b]8;;${url}\u0007${label}\u001b]8;;\u0007`;
}

// Usage: console.log(terminalLink("Open Docs", "https://example.com"));

/**
 * padQuestion — for indenting Enquirer questions
 * @param msg - the question to indent
 * @param pad - default horizontal indent (12 spaces)
 */
export const padQuestion = (msg: string, pad = 10): string => ' '.repeat(pad) + msg;
