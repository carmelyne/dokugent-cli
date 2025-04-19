#!/usr/bin/env node
const { program } = require('commander');
const { scaffoldApp } = require('../lib/scaffold');

program
  .command('scaffold app')
  .description('Scaffold a docu-first AI project folder')
  .action(scaffoldApp);

program.parse(process.argv);
