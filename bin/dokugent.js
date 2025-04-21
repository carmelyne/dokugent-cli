#!/usr/bin/env node
import { program } from 'commander';
import { scaffoldApp, compileBriefing } from '../lib/core/scaffoldApp.js';
import { printHelp } from '../lib/help/helpText.js';
import { printSecrets } from '../lib/help/secretsHelp.js';
import { chikaNiMarites } from '../lib/help/gptMarites.js';

program
  .command('scaffold <scope>')
  .description('Scaffold a .dokugent folder for the given scope')
  .option('--force', 'Overwrite existing files')
  .option('--backup', 'Create .bak backups before overwriting')
  .option('--with-checklists', 'Include starter checklist content')
  .option('--llm <agent>', 'Compile agent briefing instead of standard scaffold')
  .action((scope, options) => {
    scaffoldApp(scope, {
      force: options.force,
      backup: options.backup,
      withChecklists: options.withChecklists,
      llm: options.llm,
    });
  });

program
  .command('compile')
  .description('Compile an agent briefing from existing .dokugent/ files')
  .option('--llm <agent>', 'Agent to compile briefing for')
  .action((options) => {
    if (!options.llm) {
      console.error('❌ Please specify an agent with --llm');
      process.exit(1);
    }

    compileBriefing(options.llm);
  });

if (process.argv.includes('help') && process.argv.includes('secrets')) {
  printSecrets();
  process.exit(0);
}

if (process.argv.includes('help') && process.argv.includes('marites')) {
  chikaNiMarites();
  process.exit(0);
}

if (process.argv.includes('help') || process.argv.includes('--help')) {
  printHelp();
  process.exit(0);
}

program.parse(process.argv);
