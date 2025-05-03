#!/usr/bin/env node
import { program } from 'commander';
import { scaffoldApp } from '../lib/core/scaffold.js';
import { compileBriefing } from '../lib/core/compile.js';
import { printHelp } from '../lib/help/helpText.js';
import { printSecrets } from '../lib/help/secretsHelp.js';
import { chikaNiMarites } from '../lib/help/gptMarites.js';
import { certifyBlueprint, generateKeypair } from '../lib/core/certify.js';

program
  .command('scaffold [scope]')
  .description('Scaffold a .dokugent folder for the given scope')
  .option('--force', 'Overwrite existing files')
  .option('--backup', 'Create .bak backups before overwriting')
  .option('--with-checklists', 'Include starter checklist content')
  .option('--llm <agent>', 'Compile agent briefing instead of standard scaffold')
  .option('--custom <folder>', 'Scaffold a custom-named scope folder')
  .option('--blueprint <name>', 'Use a blueprint from blueprints.json')
  .action((scope, options) => {
    // If --custom is used, ignore scope and validate it's the only flag
    if (options.custom) {
      if (scope) {
        console.error('❌ The --custom flag cannot be used with a named scope.');
        process.exit(1);
      }
      if (!options.blueprint) {
        console.error('❌ The --custom flag must be used with --blueprint.');
        process.exit(1);
      }
      scaffoldApp('custom', {
        force: options.force,
        backup: options.backup,
        withChecklists: options.withChecklists,
        llm: options.llm,
        custom: options.custom,
        blueprint: options.blueprint
      });
      return;
    }

    if (!scope) {
      console.error('❌ Please provide a scope or use --custom=<folder>');
      process.exit(1);
    }

    scaffoldApp(scope, {
      force: options.force,
      backup: options.backup,
      withChecklists: options.withChecklists,
      llm: options.llm,
      blueprint: options.blueprint
    });
  });


program
  .command('review')
  .description('Create or update a review file (protocol or steps)')
  .option('--scope <folder>', 'Target folder inside .dokugent to review')
  .option('--with-checklists', 'Include starter checklist content')
  .option('--protocols <items>', 'Comma-separated protocol folders or "all"')
  .option('--plan', 'Generate or update review-plan.yaml')
  .action(async (options) => {
    const scope = options.scope || '.dokugent';

    const { runReview } = await import('../lib/core/review.js');
    runReview({ scope, protocols: options.protocols, plan: options.plan, withChecklists: options.withChecklists });
  });

program
  .command('compile')
  .description('Compile agent-ready files from reviewed plan or protocols')
  .option('--plan', 'Compile the reviewed plan into compiled-plan.md')
  .option('--protocols', 'Compile the reviewed protocols into compiled-protocols.md')
  .option('--prod', 'Write output to compiled/prod/')
  .option('--dev', 'Write output to compiled/dev/')
  .option('--llm <agent>', 'Optional agent type (e.g. codex, claude)')
  .option('--versioned', 'Save compiled output with a timestamped filename')
  .action((options) => {
    if (!options.plan && !options.protocols) {
      console.error('❌ Please specify either --plan or --protocols');
      process.exit(1);
    }

    if (options.plan) {
      compileBriefing('plan', options);
    }

    if (options.protocols) {
      compileBriefing('protocols', options);
    }
  });

program
  .command('certify')
  .description('Certify the current review.md by signing it with a private key')
  .option('--scope <folder>', 'Target .dokugent folder', '.dokugent')
  .option('--key <path>', 'Path to the private key PEM file')
  .option('--versioned', 'Save cert with a timestamped filename')
  .action((options) => {
    if (!options.key) {
      console.error('❌ Please specify a private key with --key');
      process.exit(1);
    }

    certifyBlueprint({ scope: options.scope, key: options.key, versioned: options.versioned });
  });

program
  .command('keygen')
  .description('Generate a new RSA keypair for certification')
  .option('--name <string>', 'Signer identity for key metadata')
  .action((options) => {
    if (!options.name) {
      console.error('❌ Please provide a signer name using --name');
      process.exit(1);
    }

    generateKeypair(options.name);
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
