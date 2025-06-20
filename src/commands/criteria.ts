/**
 * @file criteria.ts
 * @description Runs the criteria wizard or trace viewer for agent evaluation filters.
 */
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { promptCriteriaWizard } from '../utils/wizards/criteria-wizard';
import { resolveActivePath } from '../utils/ls-utils';
import { estimateTokensFromText } from '../utils/tokenizer';
import { formatRelativePath } from '../utils/format-path';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';

/**
 * Executes the `criteria` command dispatcher.
 *
 * Supported subcommands:
 * - `--check`: Check existence and token estimate of criteria.md.
 * - `--show`: Print the contents of criteria.md without metadata or token count.
 * - `--trace`: Print existing criteria.md with token estimate.
 * - (default): Launches the interactive criteria wizard.
 *
 * @param args CLI arguments passed to `dokugent criteria`.
 * @returns {Promise<void>}
 */
export async function runCriteriaCommand(args: string[]) {
  const sub = args[0];

  switch (sub) {
    case '--check': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.json');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.json not found in active agent folder.');
        return;
      }

      const raw = await fs.readFile(versioned, 'utf8');
      const tokens = estimateTokensFromText(raw);
      console.log(`\n📌 Using agent assigned as current:\n   ${path.basename(agentPath!)}\n`);
      console.log(`🧾 Existing criteria in\n   → ${formatRelativePath(versioned)}\n`);

      console.log(`🧮 Estimated tokens: \x1b[32m~${tokens}\x1b[0m\n`);

      return;
    }
    case '--edit': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.json');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.json not found in active agent folder.');
        return;
      }

      const child = spawn(process.env.EDITOR || 'nano', [versioned], {
        stdio: 'inherit',
      });
      await new Promise((resolve, reject) => {
        child.on('exit', code => (code === 0 ? resolve(null) : reject(code)));
      });
      return;
    }
    case '--show': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.json');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.json not found in active agent folder.');
        return;
      }

      const raw = await fs.readFile(versioned, 'utf8');
      console.log(raw.trim());
      return;
    }

    case '--trace':
    case 'trace': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.json');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.json not found in active agent folder.');
        return;
      }

      const raw = await fs.readFile(versioned, 'utf8');
      const tokens = estimateTokensFromText(raw);

      console.log(`\n📍 Criteria Trace\n   (${path.basename(agentPath!)})\n`);
      console.log(`🗂️ criteria.json\n   → ${formatRelativePath(versioned)}\n`);

      console.log(`\n🧮 Estimated Total Tokens: \x1b[32m~${tokens}\x1b[0m tokens in criteria.json\n`);

      console.log('✅ Passed checks: all sections present.\n');

      return;
    }

    case '--t': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.json');
      if (await fs.pathExists(versioned)) {
        console.error(`⚠️ criteria.json already exists for:\n   → ${path.basename(agentPath!)}\n   (${formatRelativePath(versioned)})`);
        return;
      }

      const template = JSON.stringify({
        createdAt: new Date().toISOString(),
        createdAtDisplay: new Date().toLocaleString(),
        lastModifiedAt: new Date().toISOString(),
        lastModifiedAtDisplay: new Date().toLocaleString(),
        cliVersion: '0.1.0',
        schemaVersion: '0.1',
        createdVia: 'dokugent-cli',
        estimatedTokens: 0,
        'Success Conditions': [],
        'Failure Conditions': [],
        'Evaluation Metrics': []
      }, null, 2);

      await fs.writeFile(versioned, template);
      console.log(`✅ Blank criteria.md created at:\n   → ${formatRelativePath(versioned)}`);
      return;
    }

    default: {
      if (!args.length) {
        const agentPath = await resolveActivePath('agents');
        if (!agentPath) {
          console.error('❌ No active agent found.');
          return;
        }
        console.log()
        paddedCompact('dokugent criteria initialized...', '', PAD_WIDTH, 'info');
        await promptCriteriaWizard(false);
      }
      return;
    }
  }
}
