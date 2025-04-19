#!/usr/bin/env node
const { program } = require('commander');
const { scaffoldApp } = require('../lib/scaffold');

program
  .command('scaffold <scope>')
  .description('Scaffold a .docugent folder for the given scope')
  .option('--force', 'Overwrite existing files')
  .option('--backup', 'Create .bak backups before overwriting')
  .action((scope, options) => {
    scaffoldApp(scope, { force: options.force, backup: options.backup });
  });

program.parse(process.argv);
