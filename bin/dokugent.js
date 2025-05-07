#!/usr/bin/env node
import { program } from 'commander';
import { initCore } from '../lib/core/init.js';
import { init as initBlank } from '../lib/core/init.js';
import { printHelp } from '../lib/help/helpText.js';
import { runPlan } from '../lib/core/plan.js';

const calledAs = process.argv[1]?.split('/').pop();
if (calledAs === 'doku') {
  program.name('doku');
} else {
  program.name('dokugent');
}

program
  .description('Documentation-first CLI for agent scaffolding')
  .version('1.0.0');

program
  .command('init')
  .argument('[type]', 'init type: core')
  .argument('[group]', 'core group: dev, writing, research')
  .description('Initialize a blank or core-based .dokugent project')
  .option('--force', 'overwrite existing .dokugent folder after backing it up')
  .action(async (type, group, options) => {
    const force = options.force || false;
    if (type === 'core' && group) {
      await initCore(group, force);
      console.log(`✅ Initialized .dokugent core group: ${group}`);
    } else {
      await initBlank(force);
      console.log('✅ Initialized blank .dokugent project structure');
    }
  });

program
  .command('help')
  .description('Print help documentation')
  .action(() => {
    printHelp();
  });

program
  .command('plan')
  .description('Create or update plan.md and plan.yaml in the .dokugent/plan folder')
  .option('--force', 'overwrite existing files without confirmation')
  .action(async (options) => {
    await runPlan({ force: options.force || false });
  });

program.parse(process.argv);
