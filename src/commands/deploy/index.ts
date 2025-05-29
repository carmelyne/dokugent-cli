import { runPreviewCommand } from '../preview';
import { runCertifyCommand } from '../certify';
import { runCompileCommand } from '../compile';
import inquirer from 'inquirer';

export async function runDeployCommand(argv: string[]) {
  const args = require('minimist')(argv);
  let identity = args.id || null;
  let valid = args.valid || null;
  const silent = !!args.silent;

  if (!identity || !valid) {
    const responses = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: '🪪 Who should be used as signing identity?',
        default: 'Carms',
      },
      {
        type: 'input',
        name: 'valid',
        message: '📅 Set certificate validity period (e.g. 6m, 1y)',
        default: '6m',
      },
    ]);

    if (!identity) identity = responses.id;
    if (!valid) valid = responses.valid;
  }

  console.log('🚀 Starting dokugent deploy sequence...\n');

  await runPreviewCommand();

  await runCertifyCommand({
    flags: {
      id: identity,
      valid,
      silent,
    },
  });

  await runCompileCommand();

  console.log('\n✅ dokugent deploy completed.');
}
