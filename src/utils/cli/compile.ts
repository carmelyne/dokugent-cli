import chalk from 'chalk';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';

export const COMPILE_PAD_WIDTH = 12;

export function compileStatusLog(label: string, description: string, status: 'info' | 'warn' | 'pass' | 'fail' | undefined, reasons?: string[]) {
  const PAD_WIDTH = 12;

  let symbol = '';
  let color = chalk.white;

  switch (status) {
    case 'info':
      symbol = glyphs.info;
      color = chalk.cyan;
      break;
    case 'warn':
      symbol = glyphs.warning;
      color = chalk.yellow;
      break;
    case 'pass':
      symbol = glyphs.check;
      color = chalk.green;
      break;
    case 'fail':
      symbol = glyphs.cross;
      color = chalk.red;
      break;
    default:
      symbol = '';
      color = chalk.white;
  }

  const coloredLabel = color(label.padEnd(PAD_WIDTH, ' '));
  console.log(`${' '.repeat(12)}${symbol} ${coloredLabel}${description}`);

  if (status === 'fail' && reasons && reasons.length) {
    reasons.forEach(reason => {
      console.log(`        - ${chalk.gray(reason)}`);
    });
  }
}

export function compileCertLog(
  header: string,
  value: string,
  type: 'CERT' | 'SHA' = 'CERT'
) {
  const label = type.padEnd(COMPILE_PAD_WIDTH, '      ');
  const color = type === 'CERT' ? chalk.green : chalk.cyan;

  console.log(`${label}${color(value)}`);
}
