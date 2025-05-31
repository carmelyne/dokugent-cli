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

      const versioned = path.resolve(agentPath!, 'criteria.md');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.md not found in active agent folder.');
        return;
      }

      const raw = await fs.readFile(versioned, 'utf8');
      const tokens = estimateTokensFromText(raw);
      console.log(`\n📌 Using agent assigned as current:\n   ${path.basename(agentPath!)}\n`);
      console.log(`🧾 Existing criteria in\n   → ${formatRelativePath(versioned)}\n`);

      const sections = {
        'Success Conditions': /## Success Conditions\n([\s\S]*?)(?=\n##|$)/,
        'Failure Conditions': /## Failure Conditions\n([\s\S]*?)(?=\n##|$)/,
        'Evaluation Metrics': /## Evaluation Metrics\n([\s\S]*?)(?=\n##|$)/,
      };

      const missing: string[] = [];

      for (const [label, regex] of Object.entries(sections)) {
        const match = raw.match(regex);
        if (!match?.[1]?.trim().includes('- ')) {
          missing.push(label);
        }
      }

      console.log(`🧮 Estimated tokens: \x1b[32m~${tokens}\x1b[0m\n`);

      if (missing.length === 0) {
        console.log(`✅ Passed checks:\n   ✓ Success Conditions\n   ✓ Failure Conditions\n   ✓ Evaluation Metrics\n`);
      } else {
        console.log(`❌ Missing or empty sections:\n   - ${missing.join('\n   - ')}`);
      }

      return;
    }
    case '--edit': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.md');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.md not found in active agent folder.');
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

      const versioned = path.resolve(agentPath!, 'criteria.md');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.md not found in active agent folder.');
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

      const versioned = path.resolve(agentPath!, 'criteria.md');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.md not found in active agent folder.');
        return;
      }

      const raw = await fs.readFile(versioned, 'utf8');
      const tokens = estimateTokensFromText(raw);

      const sections = {
        'Success Conditions': /## Success Conditions\n([\s\S]*?)(?=\n##|$)/,
        'Failure Conditions': /## Failure Conditions\n([\s\S]*?)(?=\n##|$)/,
        'Evaluation Metrics': /## Evaluation Metrics\n([\s\S]*?)(?=\n##|$)/,
      };

      console.log(`\n📍 Criteria Trace\n   (${path.basename(agentPath!)})\n`);
      console.log(`🗂️ criteria.md\n   → ${formatRelativePath(versioned)}\n`);

      for (const [label, regex] of Object.entries(sections)) {
        const match = raw.match(regex);
        const bullets = match?.[1].trim().split('\n').filter(l => l.trim().startsWith('-')) || [];

        console.log(`\n### ${label}`);
        if (bullets.length) {
          bullets.forEach(line => console.log(`  ${line.trim()}`));
        } else {
          console.log('  ⚠️  No entries found.');
        }
      }

      const missing: string[] = [];

      for (const [label, regex] of Object.entries(sections)) {
        const match = raw.match(regex);
        if (!match?.[1]?.trim().includes('- ')) {
          missing.push(label);
        }
      }

      console.log(`\n🧮 Estimated Total Tokens: \x1b[32m~${tokens}\x1b[0m tokens in criteria.md\n`);

      if (missing.length === 0) {
        console.log('✅ Passed checks: all sections present.\n');
      } else {
        console.log(`❌ Missing or empty sections:\n  - ${missing.join('\n  - ')}\n`);
      }
      return;
    }

    case '--t': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath!, 'criteria.md');
      if (await fs.pathExists(versioned)) {
        console.error(`⚠️ criteria.md already exists:\n   → ${formatRelativePath(versioned)}`);
        return;
      }

      const template = `# CRITERIA.md

## Success Conditions
-

## Failure Conditions
-

## Evaluation Metrics
-
`;

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
        await promptCriteriaWizard(false);
      }
      return;
    }
  }
}
