import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';

function verticalSpace(lines = 1): void {
  process.stdout.write('\n'.repeat(lines));
}

export const ui = {
  info: (msg: string) => console.log(chalk.blueBright(`INFO     `.padEnd(13) + msg)),
  success: (msg: string) => console.log(chalk.green(`SUCCESS  `.padEnd(13) + msg)),
  warn: (msg: string) => console.warn(chalk.yellow(`WARNING  `.padEnd(13) + msg)),
  error: (msg: string) => console.error(chalk.red(`ERROR    `.padEnd(13) + msg)),
  headline: (msg: string) => console.log(chalk.bold.underline(`\n🔹 ${msg}`)),

  box: (
    msg: string,
    color: 'green' | 'cyan' | 'yellow' | 'red' = 'green'
  ) =>
    console.log(
      boxen(msg, {
        padding: 1,
        borderColor: color,
        align: 'center',
      })
    ),

  spinner: (text: string) => ora(text).start(),
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
  // level: 'success' | 'info' | 'warn' | 'error' = 'info',
  level: 'success' | 'info' | 'warn' | 'error' | 'blue' | 'orange' | 'pink' | 'purple' | 'magenta' = 'info',
  labelPrefix?: string
): void {
  const colorMap: Record<'success' | 'info' | 'warn' | 'error' | 'blue' | 'orange' | 'pink' | 'purple' | 'magenta', chalk.Chalk> = {
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

  const prefixText = labelPrefix ? labelPrefix.padEnd(width) : level.toUpperCase().padEnd(width);
  const prefix = colorMap[level](prefixText);
  const indent = chalk.dim(''.padEnd(width));

  verticalSpace(1); // top margin
  console.log(`${prefix}${label}`);
  console.log(`${indent}${chalk.white(value)}`);
  // verticalSpace(1); // bottom margin
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
