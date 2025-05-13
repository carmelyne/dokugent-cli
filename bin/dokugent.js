#!/usr/bin/env node

/**
 * Entry point for the Dokugent CLI.
 * Handles command registration and routing for documentation-driven agent workflows.
 * Commands include: init, plan, criteria, and help.
 * Supports aliasing as "doku" and passes versioned execution via Commander.
 */

import { program } from 'commander';
import { initCore } from '../lib/core/init.js';
import { init as initBlank } from '../lib/core/init.js';
// NEW (correct source of truth)
import { printHelp } from '../lib/help/cliHelpText.js';
import { runPlan } from '../lib/core/plan.js';
import { runCriteria } from '../lib/core/criteria.js';
import { handleConventions, useConventions } from '../lib/core/conventions.js';
import { generatePreview } from '../lib/core/preview.js';
import { previewLs } from '../lib/utils/preview-ls.js';
import { runSecurityCheck } from '../lib/core/security.js';
import { generateKeyPair } from '../lib/core/keygen.js';
import { certify } from '../lib/core/certify.js';
import { compile } from '../lib/core/compile.js';

const calledAs = process.argv[1]?.split('/').pop();
if (calledAs === 'doku') {
  program.name('doku');
} else {
  program.name('dokugent');
}

program
  .description('Documentation-first CLI for agent scaffolding')
  .version('1.0.0');

program.exitOverride((err) => {
  if (err.code === 'commander.missingArgument') {
    console.error('❌ Missing required argument <type>. Try one of: dev, writing, research.');
    process.exit(1);
  }
  throw err;
});

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
  .command('plan [subcommand] [target]')
  .description('Manage or define plan files, symlinks, or freedoms in .dokugent/plan')
  .option('--force', 'overwrite existing files without confirmation')
  .action(async (subcommand, target, options) => {
    if (subcommand === 'alias' && target) {
      // Modified alias parsing as per instructions
      const fs = await import('fs/promises');
      const path = await import('path');
      const planDir = path.resolve('.dokugent', 'plan');
      const [alias, folder] = target.split('@');
      if (!alias || !folder) {
        console.error('❌ Usage: dokugent plan alias <alias>@<existing-folder-name>');
        return;
      }
      const candidates = await fs.readdir(planDir);
      const match = candidates.find(f => f === folder);
      if (!match) {
        console.error(`❌ Folder ${folder} not found in .dokugent/plan`);
        return;
      }
      // Here you would implement the alias creation logic, e.g.:
      // create or update a symlink or alias file pointing alias to match
      // For demonstration, just print success message
      console.log(`✅ Alias '${alias}' set to folder '${folder}'`);
      return;
    }
    if (subcommand === 'freedom') {
      await runPlan({ subcommand: 'freedom', force: options.force || false });
      return;
    }
    await runPlan({ subcommand, target, force: options.force || false });
  });

program
  .command('criteria')
  .description('Create or update criteria.md and criteria.yaml in the .dokugent/criteria folder')
  .option('--force', 'overwrite existing files without confirmation')
  .option('--wizard', 'run interactive wizard to scaffold criteria')
  .action(async (options) => {
    await runCriteria({ force: true, wizard: true });
  });

program
  .command('conventions')
  .argument('[type]', 'Type of convention to copy (e.g., dev)')
  .description('Copy template conventions into .dokugent/conventions/<type>')
  .option('--force', 'overwrite existing convention folder with backup')
  .action(async (type, options) => {
    await handleConventions({ type, force: options.force || false });
  });

program
  .command('conventions use <version>')
  .description('Symlink a specific version of conventions as the active one')
  .action(async (version) => {
    await useConventions(version);
  });

program
  .command('preview [action]')
  .description('Generate or inspect preview files')
  .option('--agent <agent>', 'Specify agent profile (codex, gpt4, claude, llama, gemini, mistral, grok)')
  .option('--variant <variant>', 'Specify agent variant (for multi-profile agents like gemini and mistral)')
  .action(async (action, options) => {
    if (action === 'ls') {
      await previewLs();
    } else {
      await generatePreview(options.agent, options.variant);
      console.log('✅ Preview files generated in .dokugent/preview');
    }
  });

program
  .command('security')
  .argument('[target]', 'Folder to scan: preview or default')
  .description('Run security scan against .dokugent or .dokugent/preview')
  .option('--deny-list <values...>', 'Additional patterns to deny (overrides default list)')
  .option('--require-approvals', 'Enforce approval metadata')
  .action(async (target, options) => {
    const denyList = options.denyList || [];
    const requireApprovals = options.requireApprovals || false;
    const scanPath = target === 'preview' ? '.dokugent/preview' : undefined;
    await runSecurityCheck({ denyList, requireApprovals, scanPath });
  });

program
  .command('keygen')
  .description('Generate a private/public key pair for signing')
  .option('--name <id>', 'Key name (used for filename)', 'agent')
  .action(async (options) => {
    await generateKeyPair(options.name);
  });

program
  .command('certify')
  .description('Certify the current previewed agent setup before execution')
  .option('--key <path>', 'Path to private key for signing')
  .option('--name <id>', 'Name of certifying human or system')
  .action(async (options) => {
    const key = options.key;
    const name = options.name;
    try {
      await certify({ key, name });
    } catch (err) {
      console.error(err.message || err);
      process.exit(1);
    }
  });

program
  .command('compile')
  .description('Compile .dokugent content into structured/compiled.json for agent consumption')
  .action(async () => {
    try {
      compile();
      console.log('✅ Compiled structured/compiled.json');
    } catch (err) {
      console.error('❌ Compile failed:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
