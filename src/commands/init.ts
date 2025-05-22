/**
 * @file init.ts
 * @description Initializes a new Dokugent project by creating the required folder structure,
 * setting up agent scaffolding, and optionally bypassing the wizard with default values.
 */
import fs from 'fs-extra';
import path from 'path';
import { confirmAndWriteFile } from '../utils/fs-utils';

/**
 * Executes the Dokugent `init` command.
 *
 * - Creates all base `.dokugent/` directories and override files
 * - Saves generated README
 *
 * @returns {Promise<void>}
 */
export async function runInitCommand(): Promise<void> {
  console.log("\n⚙️ Running dokugent init...\n");
  const baseDirs = [
    '.dokugent/data/agents',
    '.dokugent/data/tool-list',
    '.dokugent/data/plan',
    '.dokugent/data/criteria',
    '.dokugent/data/conventions',
    '.dokugent/data/io',
    '.dokugent/data/compliance',
    '.dokugent/ops/preview',
    '.dokugent/ops/compiled',
    '.dokugent/ops/certified',
    '.dokugent/ops/logs',
    '.dokugent/ops/reports',
    '.dokugent/audit/trace',
    '.dokugent/audit/signatures',
    '.dokugent/overrides'
  ];

  for (const dir of baseDirs) {
    await fs.ensureDir(path.resolve(dir));
  }

  console.log('\x1b[43m\x1b[30m📁 Created base .dokugent structure.\x1b[0m\n');
  console.log(`📂 .dokugent/
├── audit       → Signature logs and trace evidence
├── data        → Editable input: agent, plans, tools, rules
├── ops         → Output folders: preview, compiled, certified agents
└── overrides   → Local dev overrides like whitelists
  `);

  // Ensure .dokugent/overrides/whitelist.txt exists
  const whitelistPath = path.resolve('.dokugent/overrides/whitelist.txt');
  if (!(await fs.pathExists(whitelistPath))) {
    await fs.outputFile(whitelistPath, '');
  }

  const readmeContentFinal = `# Dokugent Workspace

This folder was initialized using Dokugent CLI.
It is safe to commit, inspect, and modify files under .dokugent/.

📖 See: https://github.com/carmelyne/dokugent-cli
  `;

  const readmePathFinal = path.resolve('.dokugent/README.md');
  await confirmAndWriteFile(readmePathFinal, readmeContentFinal);

  console.log('➡️ You can now run: \x1b[34mdokugent agent\x1b[0m\n');
}
