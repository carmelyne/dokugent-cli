
/**
 * @file criteria.ts
 * @description Runs the criteria wizard or trace viewer for agent evaluation filters.
 */
import fs from 'fs-extra';
import path from 'path';
import { promptCriteriaWizard } from '../utils/wizards/criteria-wizard';
import { resolveActivePath } from '../utils/ls-utils';
import { estimateTokensFromText } from '../utils/tokenizer';
import { formatRelativePath } from '../utils/format-path';

/**
 * Executes the `criteria` command dispatcher.
 *
 * Supported subcommands:
 * - `trace`: Print existing criteria.md with token estimate.
 * - (default): Launches the interactive criteria wizard.
 *
 * @param args CLI arguments passed to `dokugent criteria`.
 * @returns {Promise<void>}
 */
export async function runCriteriaCommand(args: string[]) {
  const sub = args[0];

  switch (sub) {
    case 'trace': {
      const agentPath = await resolveActivePath('criteria');
      if (!agentPath) {
        console.error('❌ No active agent found.');
        return;
      }

      const versioned = path.resolve(agentPath, 'criteria.md');
      if (!(await fs.pathExists(versioned))) {
        console.error('❌ criteria.md not found in active agent folder.');
        return;
      }

      const raw = await fs.readFile(versioned, 'utf8');
      const tokens = estimateTokensFromText(raw);

      console.log(`\n📌 Using agent assigned as current:\n   ${path.basename(agentPath)}\n`);
      console.log(`🧾 Existing criteria in\n   → ${formatRelativePath(versioned)}\n`);
      console.log(raw.trim());
      console.log(`\n🧮 Estimated tokens: \x1b[32m~${tokens}\x1b[0m\n`);
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
