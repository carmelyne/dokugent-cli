#!/usr/bin/env node
import { program } from 'commander';
import { scaffoldApp, compileBriefing } from '../lib/core/scaffoldApp.js';

program
  .command('scaffold <scope>')
  .description('Scaffold a .docugent folder for the given scope')
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
  .description('Compile an agent briefing from existing .docugent/ files')
  .option('--llm <agent>', 'Agent to compile briefing for')
  .action((options) => {
    if (!options.llm) {
      console.error('❌ Please specify an agent with --llm');
      process.exit(1);
    }

    compileBriefing(options.llm);
  });

program.parse(process.argv);
