/**
 * @file conventions.ts
 * @description CLI dispatcher for conventions commands and conventions wizard.
 */
import fs from 'fs-extra';
import path from 'path';
import { globby } from 'globby';
import { promptConventionsWizard } from '@utils/wizards/conventions-wizard';
import { resolveActivePath } from '@utils/ls-utils';
import { formatRelativePath } from '@utils/format-path';
import { estimateTokensFromText } from '@utils/tokenizer';
import getActiveAgentInfo from '@utils/agent-info';
import chalk from 'chalk';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault } from '@utils/cli/ui';
/**
 * Executes the `conventions` command dispatcher.
 *
 * Supported subcommands:
 * - `--check`: Check existence and list markdown files in the conventions folder.
 * - `--show`: Print the contents of all markdown files in the conventions folder.
 * - `--t`: Create a blank README.md in the conventions folder.
 * - (default): Launches the interactive conventions wizard.
 *
 * @param args CLI arguments passed to `dokugent conventions`.
 * @returns {Promise<void>}
 */
export async function runConventionsCommand(args: string[]) {
  const sub = args[0];

  switch (sub) {
    case '--check': {
      const baseDir = path.resolve('.dokugent/data/conventions');
      const folders = await fs.readdir(baseDir);
      let totalAllTokens = 0;
      let foundAny = false;

      for (const folder of folders) {
        const candidate = path.join(baseDir, folder, 'latest');
        if (!(await fs.pathExists(candidate))) continue;

        const dirPath = await fs.realpath(candidate);
        const mdFiles = await globby('**/*.md', { cwd: dirPath });

        if (!mdFiles.length) {
          console.log(`❌ No markdown files found in: ${formatRelativePath(dirPath)}\n`);
          continue;
        }

        foundAny = true;
        let totalTokens = 0;
        console.log(`✅ Convention folder: ${formatRelativePath(dirPath)}\n`);
        console.log(`📄 Files found:`);

        for (const file of mdFiles) {
          const fullPath = path.join(dirPath, file);
          const size = (await fs.stat(fullPath)).size;
          const content = await fs.readFile(fullPath, 'utf8');
          const tokens = estimateTokensFromText(content);
          totalTokens += tokens;
          console.log(` - ${file} (${size} bytes, ~${tokens} tokens)`);
        }

        totalAllTokens += totalTokens;
        console.log(`\n🧮 Total estimated tokens in folder: \x1b[32m~${totalTokens}\x1b[0m\n`);
      }

      if (!foundAny) {
        console.error('❌ No active convention folders found.');
      } else {
        console.log(`🧾 Combined estimated tokens across all folders: \x1b[32m~${totalAllTokens}\x1b[0m\n`);
      }
      return;
    }

    case '--show':
    case '--trace': {
      const baseDir = path.resolve('.dokugent/data/conventions');
      const folders = await fs.readdir(baseDir);
      let foundAny = false;

      for (const folder of folders) {
        const candidate = path.join(baseDir, folder, 'latest');
        if (!(await fs.pathExists(candidate))) continue;

        const dirPath = await fs.realpath(candidate);
        const mdFiles = await globby('**/*.md', { cwd: dirPath });

        if (!mdFiles.length) continue;

        foundAny = true;
        console.log(`📍 Convention Trace: ${formatRelativePath(dirPath)}\n`);

        for (const file of mdFiles) {
          const fullPath = path.join(dirPath, file);
          const content = await fs.readFile(fullPath, 'utf8');
          const tokens = estimateTokensFromText(content);
          console.log(`\n# ${file} (~${tokens} tokens)\n`);
          console.log(content.trim());
        }

        console.log('\n──────────────────────────────\n');
      }

      if (!foundAny) {
        console.error('❌ No active convention folders found.');
      }
      return;
    }

    case '--t': {
      const agentCurrentSymlink = path.join('.dokugent/data/agents', 'current');
      let agentId = '';
      try {
        agentId = await fs.readlink(agentCurrentSymlink);
      } catch (err) {
        console.log(`⚠️ Could not read current agent symlink at ${agentCurrentSymlink}. Please ensure it exists.`);
        return;
      }

      const typeArg = args[1];
      let dirPath: string | null = null;

      if (typeArg) {
        const baseFolder = path.join('.dokugent/data/conventions', typeArg);
        await fs.ensureDir(baseFolder);
        const latestLink = path.join(baseFolder, 'latest');

        const contents = await fs.readdir(baseFolder);
        const versionedFolders = contents.filter(name => name.startsWith('happybot@'));

        if (await fs.pathExists(latestLink)) {
          dirPath = await fs.realpath(latestLink);
        } else if (versionedFolders.length === 1) {
          const target = path.join(baseFolder, versionedFolders[0]);
          await fs.symlink(versionedFolders[0], latestLink, 'dir');
          dirPath = target;
        } else if (versionedFolders.length === 0) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const versionSlug = `${agentId}`;
          const newFolder = path.join(baseFolder, versionSlug);
          await fs.ensureDir(newFolder);
          await fs.symlink(versionSlug, latestLink, 'dir');
          dirPath = newFolder;
        }
      } else {
        dirPath = await resolveActivePath('conventions');
      }

      if (!dirPath) {
        console.error('❌ No active convention folder resolved.');
        return;
      }
      if (dirPath.includes('/dev/')) {
        console.error('⚠️ The --t flag is only for initializing custom convention folders, not dev.');
        return;
      }

      const filePath = path.join(dirPath, 'README.md');
      if (await fs.pathExists(filePath)) {
        console.error(`⚠️ README.md already exists:\n   → ${formatRelativePath(filePath)}`);
        return;
      }

      const template = `# Convention Notes\n\nAdd guidance files like GPT4.md, StyleGuide.md, etc.`;
      await fs.writeFile(filePath, template);
      console.log(`✅ Blank README.md created:\n   → ${formatRelativePath(filePath)}`);
      return;
    }

    default: {

      paddedLog('dokugent conventions initialized...', '', PAD_WIDTH, 'info');
      console.log()

      if (!args.length) {
        await promptConventionsWizard();

        const baseTypes = ['dev', 'writing', 'research', 'custom'];

        for (const type of baseTypes) {
          const baseFolder = path.join('.dokugent/data/conventions', type);
          const { agentId } = await getActiveAgentInfo();
          const agentFolder = path.join(baseFolder, agentId);
          const latestLink = path.join(agentFolder, 'latest');

          if (await fs.pathExists(latestLink)) {
            const targetPath = await fs.realpath(latestLink);
            const markdowns = await globby('*.md', { cwd: targetPath });

            let meta;
            if (type === 'dev') {
              meta = {
                by: 'wizard',
                type,
                agentId,
                createdAt: new Date().toISOString(),
                conventions: markdowns.map(f => ({
                  llmName: path.basename(f, '.md'),
                  file: f,
                  content: ''
                }))
              };
            } else {
              meta = {
                by: 'wizard',
                type,
                agentId,
                createdAt: new Date().toISOString(),
                files: markdowns
              };
            }

            const metaPath = path.join(targetPath, 'conventions.meta.json');
            await fs.writeJson(metaPath, meta, { spaces: 2 });
          }
        }
      }
      return;
    }
  }
}

export const command = {
  run: runConventionsCommand,
  alias: ['convention'],
};
