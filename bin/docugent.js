#!/usr/bin/env node
import { program } from 'commander';
import { scaffoldApp } from '../lib/core/scaffoldApp.js';
import { scaffoldAgentBriefing } from '../lib/core/scaffoldAgentBriefing.js';

program
  .command('scaffold <scope>')
  .description('Scaffold a .docugent folder for the given scope')
  .option('--force', 'Overwrite existing files')
  .option('--backup', 'Create .bak backups before overwriting')
  .option('--with-checklists', 'Include starter checklist content')
  .option('--llm <agent>', 'Compile agent briefing instead of standard scaffold')
  .action((scope, options) => {
    if (options.llm) {
      scaffoldAgentBriefing(options.llm);
    } else {
      scaffoldApp(scope, {
        force: options.force,
        backup: options.backup,
        withChecklists: options.withChecklists,
      });
    }
  });

program.parse(process.argv);
