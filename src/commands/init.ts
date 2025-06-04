/**
 * @file init.ts
 * @description Initializes a new Dokugent project by creating the required folder structure,
 * setting up agent scaffolding, and optionally bypassing the wizard with default values.
 */
import fs from 'fs-extra';
import path from 'path';
import { paddedLog, paddedSub } from '@src/utils/cli/ui';
import { confirmAndWriteFile } from '@utils/fs-utils';

/**
 * Executes the Dokugent `init` command.
 *
 * - Creates all base `.dokugent/` directories and override files
 * - Saves generated README
 *
 * @returns {Promise<void>}
 */
export async function runInitCommand(): Promise<void> {
  paddedLog("Running dokugent init...", "");
  const targetRoot = path.resolve('.dokugent');
  if (await fs.pathExists(targetRoot)) {
    paddedLog('.dokugent folder already exists. Skipping initialization.', '', 12, 'orange', 'WARNING');
    return;
  }
  const baseDirs = [
    '.dokugent/data/agents',
    '.dokugent/data/tool-list',
    '.dokugent/data/plans',
    '.dokugent/data/criteria',
    '.dokugent/data/conventions',
    '.dokugent/data/io',
    '.dokugent/data/compliance',
    '.dokugent/ops/previews',
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

  paddedLog('Workspace scaffold complete', 'Created base .dokugent structure.', 12, 'pink', 'DIR MAP');
  paddedSub("📂 .dokugent/", [
    "├── audit       → Signature logs and trace evidence",
    "├── data        → Editable input: agent, plans, tools, rules",
    "├── keys        → Stores cryptographic keypairs and signer metadata",
    "├── ops         → Output folders: preview, compiled, certified agents",
    "├── overrides   → Local dev overrides like whitelists",
    "└── temp        → Temporary files for previews, diffs, or session state"
  ].join("\n"));
  paddedSub("📄 Files created", "- .dokugent/README.md");

  // Ensure .dokugent/overrides/whitelist.txt exists
  const whitelistPath = path.resolve('.dokugent/overrides/whitelist.txt');
  if (!(await fs.pathExists(whitelistPath))) {
    await fs.outputFile(whitelistPath, '');
  }

  // Ensure .dokugent/overrides/blacklist.txt exists
  const blacklistPath = path.resolve('.dokugent/overrides/blacklist.txt');
  if (!(await fs.pathExists(blacklistPath))) {
    await fs.outputFile(blacklistPath, '');
  }

  const readmeContentFinal = `# Dokugent Workspace

This folder was initialized using Dokugent CLI.
It is safe to commit, inspect, and modify files under .dokugent/.

📖 See: https://github.com/carmelyne/dokugent-cli
  `;

  const readmePathFinal = path.resolve('.dokugent/README.md');
  await fs.outputFile(readmePathFinal, readmeContentFinal);

  paddedSub("Ready to build", "You can now run: \x1b[34mdokugent agent\x1b[0m");
}
