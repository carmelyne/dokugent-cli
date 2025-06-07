/**
 * @file conventions-wizard.ts
 * @description Interactive CLI wizard for scaffolding convention folders used by agents.
 * Supports predefined types (dev, writing, research) and custom user-defined configurations.
 */

import { prompt } from 'enquirer';
import fs from 'fs-extra';
import path from 'path';
// import Select from 'enquirer/lib/prompts/select.js';
// import MultiSelect from 'enquirer/lib/prompts/multiselect.js';
// import Input from 'enquirer/lib/prompts/input.js';
import chalk from 'chalk';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';
import { formatRelativePath } from '@utils/format-path';


/**
 * Launches an interactive wizard for creating versioned convention folders.
 * Can scaffold from predefined templates or custom input.
 *
 * Responsibilities:
 * - Prompts user for convention type and selected agent files.
 * - Supports both template-based and manual filename selection.
 * - Writes convention folders under convention type and agentId.
 * - Updates symlinks to track the latest version per convention type and agentId.
 *
 * @param force Whether to overwrite existing folders without confirmation.
 * @returns {Promise<void>}
 */
export async function promptConventionsWizard(force = false) {
  async function getAllMarkdownFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return await getAllMarkdownFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        return [fullPath];
      } else {
        return [];
      }
    }));
    return files.flat();
  }

  try {
    const baseTemplatePath = fs.existsSync(path.resolve(__dirname, '../../../presets/templates/conventions'))
      ? path.resolve(__dirname, '../../../presets/templates/conventions')
      : path.resolve(process.cwd(), '.dokugent/conventions/templates');
    const conventionsBase = path.join(process.cwd(), '.dokugent/data/conventions');
    const agentCurrentSymlink = path.join(process.cwd(), '.dokugent/data/agents/current');

    let agentId = '';
    try {
      agentId = await fs.readlink(agentCurrentSymlink);
    } catch (err) {
      console.log(`⚠️ Could not read current agent symlink at ${agentCurrentSymlink}. Please ensure it exists.`);
      return;
    }

    const availableTypes = ['dev'];
    ['writing', 'research'].forEach(type => {
      const typePath = path.join(conventionsBase, type);
      if (!fs.existsSync(typePath)) {
        availableTypes.push(type);
      }
    });
    availableTypes.push('custom');

    let { selectedType } = await prompt<{ selectedType: string }>([
      {
        type: 'select',
        name: 'selectedType',
        message: padQuestion('Pick a convention type to scaffold:'),
        choices: availableTypes.map((type) => ({ name: type, message: padQuestion(type) })),
      }
    ]);

    if (selectedType === 'custom') {
      const { customName } = await prompt<{ customName: string }>([
        {
          type: 'input',
          name: 'customName',
          message: padQuestion('Name your custom convention type (e.g., qa, editorial):'),
          validate: (input: string) => /^[a-zA-Z0-9_-]+$/.test(input) || 'Use only letters, numbers, hyphens, or underscores'
        }
      ]);

      const { base } = await prompt<{ base: string }>([
        {
          type: 'select',
          name: 'base',
          message: padQuestion('Start your custom convention from:'),
          choices: [
            { name: 'Blank', message: padQuestion('Blank') },
            { name: 'writing', message: padQuestion('writing') },
            { name: 'research', message: padQuestion('research') }
          ],
          initial: 0,
        }
      ]);

      const targetPath = path.join(conventionsBase, customName, agentId);

      if (await fs.pathExists(targetPath) && !force) {
        console.log(`⚠️ ${path.relative(process.cwd(), targetPath)} already exists. Use --force to overwrite.`);
        // Skip return so we continue with final logging
        selectedType = customName;
      } else {
        if (base === 'Blank') {
          await fs.ensureDir(targetPath);
          const readmePath = path.join(targetPath, 'README.md');
          await fs.outputFile(readmePath, `# ${customName} Conventions\n\nDescribe your conventions here.\n`);
        } else {
          const source = path.join(baseTemplatePath, base);
          await fs.ensureDir(targetPath);
          if (await fs.pathExists(source)) {
            await fs.copy(source, targetPath);
          } else {
            console.log(`⚠️ Template not found for base "${base}". Created blank folder.`);
            const readmePath = path.join(targetPath, 'README.md');
            await fs.outputFile(readmePath, `# ${customName} Conventions\n\nDescribe your conventions here.\n`);
          }
        }

        await fs.ensureDir(targetPath);
        // Create/replace symlink for latest custom convention
        const symlinkPath = path.join(conventionsBase, customName, 'latest');
        try {
          await fs.remove(symlinkPath);
        } catch { }
        await fs.symlink(targetPath, symlinkPath, 'dir');

        const metaPath = path.join(targetPath, 'conventions.meta.json');
        const meta = {
          by: 'wizard',
          type: customName,
          agentId,
          createdAt: new Date().toISOString(),
          files: [],
          conventions: [],
        };
        await fs.writeJson(metaPath, meta, { spaces: 2 });
        // Skip return so we continue with final logging
        selectedType = customName;
      }
    }

    let selectedAgents: string[] = [];

    if (selectedType === 'dev') {
      const devTargetPath = path.join(conventionsBase, selectedType, agentId);
      await fs.ensureDir(devTargetPath);
      const existingFiles = (await fs.readdir(devTargetPath)).filter(f => f.endsWith('.md'));

      const baseFilenames = [
        'CLAUDE.md',
        'CODEX.md',
        'GEMINI.md',
        'GPT4.md',
        'GROK.md',
        'LLM-CORE.md',
        'MISTRAL.md',
      ];
      const remainingChoices = baseFilenames.filter(f => !existingFiles.includes(f));

      if (remainingChoices.length === 0) {
        console.log('All default profiles already added. Showing only custom option.');
      }

      const { selectedAgents: agents } = await prompt<{ selectedAgents: string[] }>([
        {
          type: 'multiselect',
          name: 'selectedAgents',
          message: padQuestion('Select agent profiles to include:'),
          choices: [
            ...remainingChoices.map(f => ({
              name: f,
              message: padQuestion(f),
              initial: false
            })),
            {
              name: 'custom-file-mode',
              message: padQuestion('✏️ Custom (type filenames manually)'),
              initial: false
            }
          ]
        }
      ]);
      selectedAgents = agents;

      let manualList: string[] = [];

      if (selectedAgents.includes('custom-file-mode')) {
        const { customFiles } = await prompt<{ customFiles: string }>([
          {
            type: 'input',
            name: 'customFiles',
            message: padQuestion('Enter file names (comma-separated, e.g., notes.md, summary.md):'),
            validate: (input: string) => {
              const files = input.split(',').map(f => f.trim());
              if (files.length === 0 || files.some(f => !f.endsWith('.md'))) {
                return 'All filenames must end in .md (e.g., myfile.md)';
              }
              return true;
            }
          }
        ]);

        manualList = customFiles
          .split(',')
          .map((f: string) => f.trim())
          .filter((f: string) => Boolean(f));
      }

      // Finalize selectedAgents list
      selectedAgents = selectedAgents
        .filter(f => f !== 'custom-file-mode')
        .map(f => f.trim())
        .filter(f => Boolean(f) && !f.toLowerCase().includes('custom (type filenames manually)'))
        .concat(manualList);

      if (selectedAgents.length === 0) {
        // console.log(`warning glyph test: [${glyphs.warning}]`);
        console.log(chalk.hex('#FFA500')(`${glyphs.warning} ${padQuestion('No agent files selected. Please enter filenames manually.')}`));
        // console.log(`${glyphs.warning} ${padQuestion('No agent files selected. Please enter filenames manually.')}`);
        const { customFiles } = await prompt<{ customFiles: string }>([
          {
            type: 'input',
            name: 'customFiles',
            message: padQuestion('Enter file names (comma-separated, e.g., deepseek.md, qwen.md, xwin.md):'),
            validate: (input: string) => {
              const files = input.split(',').map(f => f.trim());
              if (files.length === 0 || files.some(f => !f.endsWith('.md'))) {
                return 'All filenames must end in .md (e.g., myfile.md)';
              }
              return true;
            }
          }
        ]);

        selectedAgents = customFiles
          .split(',')
          .map((f: string) => f.trim())
          .filter((f: string) => Boolean(f));

        if (selectedAgents.length === 0) {
          console.log('❌ Still no agent files provided. Aborting.');
          return;
        }
      }
    }

    const targetPath = path.join(conventionsBase, selectedType, agentId);

    // if (await fs.pathExists(targetPath) && !force) {
    //   console.log(`📂 Adding to existing folder: ${path.relative(process.cwd(), targetPath)}`);
    // }

    if (selectedType === 'dev') {
      await fs.ensureDir(targetPath);

      for (const agentFile of selectedAgents) {
        const srcPath = path.join(baseTemplatePath, 'dev', agentFile);
        const destPath = path.join(targetPath, agentFile);
        // console.log(`🛠️ ${agentFile} → ${path.relative(process.cwd(), destPath)}`);
        try {
          if (await fs.pathExists(srcPath)) {
            await fs.copy(srcPath, destPath);
          } else {
            console.log(chalk.hex('#FFA500')(`${glyphs.warning} ${padQuestion(`Template not found for ${agentFile}. Creating placeholder..`)}`));
            await fs.outputFile(destPath, `# ${agentFile}\n\nAdd your conventions here.\n`);
          }
        } catch (err) {
          console.error(`❌ Failed to scaffold ${agentFile}:`, err);
        }
      }
      await fs.ensureDir(targetPath);
      // Create/replace symlink for latest dev convention
      const symlinkPath = path.join(conventionsBase, selectedType, 'latest');
      try {
        await fs.remove(symlinkPath);
      } catch { }
      await fs.symlink(targetPath, symlinkPath, 'dir');

      const metaPath = path.join(targetPath, 'conventions.meta.json');
      let existingMeta = { by: 'wizard', type: selectedType, agentId, createdAt: new Date().toISOString(), conventions: [] };

      if (await fs.pathExists(metaPath)) {
        try {
          existingMeta = await fs.readJson(metaPath);
        } catch {
          console.warn(`⚠️ Failed to parse existing meta. Overwriting.`);
        }
      }

      const updatedConventions = selectedAgents.map(f => ({
        llmName: path.basename(f, '.md').toUpperCase(),
        file: f.toLowerCase(),
        content: ""
      }));

      const newMeta = {
        ...existingMeta,
        by: 'wizard',
        type: selectedType,
        agentId,
        createdAt: new Date().toISOString(),
        conventions: [
          ...(existingMeta.conventions || []).filter(
            (c: any) => !updatedConventions.find((u: any) => u.file === c.file)
          ),
          ...updatedConventions
        ]
      };

      await fs.writeJson(metaPath, newMeta, { spaces: 2 });
    } else {
      const source = path.join(baseTemplatePath, selectedType);
      if (await fs.pathExists(source)) {
        await fs.copy(source, targetPath);
      } else {
        await fs.ensureDir(targetPath);
        const readmePath = path.join(targetPath, 'README.md');
        await fs.outputFile(readmePath, `# ${selectedType} Conventions\n\nAdd files to this folder as needed.\n`);
      }
    }

    await fs.ensureDir(targetPath);
    // Create/replace symlink for latest convention (non-dev types)
    const symlinkPath = path.join(conventionsBase, selectedType, 'latest');
    try {
      await fs.remove(symlinkPath);
    } catch { }
    await fs.symlink(targetPath, symlinkPath, 'dir');
    const metaPath = path.join(targetPath, 'conventions.meta.json');
    // Gather markdown files in the targetPath
    const markdowns = await getAllMarkdownFiles(targetPath);
    let meta;
    if (selectedType === 'dev') {
      meta = {
        by: 'wizard',
        type: selectedType,
        agentId,
        createdAt: new Date().toISOString(),
        conventions: markdowns.map(f => ({
          llmName: path.basename(f, '.md'),
          file: path.basename(f),
          content: ''
        }))
      };
    } else {
      meta = {
        by: 'wizard',
        type: selectedType,
        agentId,
        createdAt: new Date().toISOString(),
        files: markdowns.map(f => path.basename(f))
      };
    }
    // Write meta JSON to conventions.meta.json
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    // FINAL LOGS
    paddedLog('What is the convention type?', selectedType, PAD_WIDTH, 'magenta', 'CONV');
    paddedSub('What agent is this for?', agentId);

    if (selectedAgents && selectedAgents.length > 0) {
      paddedSub('Selected convention files', selectedAgents.join(', '));
    }
    paddedDefault("Convention folder contents", `(${markdowns.length})`, PAD_WIDTH, 'success', 'SAVED');
    const sortedFiles = [...markdowns].sort((a, b) => a.localeCompare(b));
    const renderedList = sortedFiles.map(f => {
      const line = `${glyphs.arrowRight} ${formatRelativePath(f)}`;
      if (selectedType === 'dev' && selectedAgents?.includes(path.basename(f))) {
        return chalk.green(line);
      }
      return line;
    }).join('\n');
    paddedSub('', renderedList);
    paddedSub('Conventions Json File', formatRelativePath(metaPath));

    paddedLog(
      'To assign a version as the current agent',
      `dokugent conventions --edit ${selectedAgents && selectedAgents.length > 0 ? selectedAgents[0] : (path.basename(markdowns[0]) || '')}`,
      PAD_WIDTH,
      'blue',
      'HELP'
    );
    console.log();

  } catch (error: any) {
    if (error === '' || error === null || error?.message === 'cancelled' || error?.message === 'Prompt cancelled') {
      paddedLog('Bye...', 'Convention wizard was cancelled.', PAD_WIDTH, 'warn');
      console.log();
      process.exit(0);
    }
    paddedLog('Error', error?.message || error, PAD_WIDTH, 'error');
    console.log();
    process.exit(1);
  }
}
