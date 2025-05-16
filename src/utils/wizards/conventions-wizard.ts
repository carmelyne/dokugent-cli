/**
 * @file conventions-wizard.ts
 * @description Interactive CLI wizard for scaffolding convention folders used by agents.
 * Supports predefined types (dev, writing, research) and custom user-defined configurations.
 */
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { appendTimestamp } from '../timestamp';
import { updateSymlink } from '../symlink-utils';

/**
 * Launches an interactive wizard for creating versioned convention folders.
 * Can scaffold from predefined templates or custom input.
 *
 * Responsibilities:
 * - Prompts user for convention type and selected agent files.
 * - Supports both template-based and manual filename selection.
 * - Writes convention folders with timestamped versions.
 * - Updates symlinks to track the latest version per convention type.
 *
 * @param force Whether to overwrite existing folders without confirmation.
 * @returns {Promise<void>}
 */
export async function promptConventionsWizard(force = false) {
  const baseTemplatePath = fs.existsSync(path.resolve(__dirname, '../../../presets/templates/conventions'))
    ? path.resolve(__dirname, '../../../presets/templates/conventions')
    : path.resolve(process.cwd(), '.dokugent/conventions/templates');
  const targetBase = path.join(process.cwd(), '.dokugent/conventions');

  const { selectedType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedType',
      message: '📚 Pick a convention type to scaffold:',
      choices: ['dev', 'writing', 'research', 'custom'],
      default: 'dev',
    },
  ]);

  if (selectedType === 'custom') {
    const { customName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customName',
        message: '🆕 Name your custom convention type (e.g., qa, editorial):',
        validate: (input) =>
          /^[a-zA-Z0-9_-]+$/.test(input) || 'Use only letters, numbers, hyphens, or underscores',
      },
    ]);
    const { base } = await inquirer.prompt([
      {
        type: 'list',
        name: 'base',
        message: '📦 Start your custom convention from:',
        choices: ['Blank', 'dev', 'writing', 'research'],
        default: 'Blank',
      },
    ]);

    const versioned = appendTimestamp(customName);
    const targetPath = path.join(targetBase, versioned);

    if (await fs.pathExists(targetPath) && !force) {
      console.log(`⚠️ .dokugent/conventions/${versioned} already exists. Use --force to overwrite.`);
      return;
    }

    if (base === 'Blank') {
      await fs.ensureDir(targetPath);
    } else {
      const source = path.join(baseTemplatePath, base);
      await fs.copy(source, targetPath);
    }

    await updateSymlink(targetBase, customName, versioned);
    return;
  }

  let selectedAgents: string[] = [];

  if (selectedType === 'dev') {
    const response = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAgents',
        message: '🤖 Select agent profiles to include:',
        choices: [
          { name: 'CLAUDE.md', value: 'CLAUDE.md' },
          { name: 'CODEX.md', value: 'CODEX.md' },
          { name: 'GEMINI.md', value: 'GEMINI.md' },
          { name: 'GPT4.md', value: 'GPT4.md' },
          { name: 'GROK.md', value: 'GROK.md' },
          { name: 'LLM-CORE.md', value: 'LLM-CORE.md' },
          { name: 'MISTRAL.md', value: 'MISTRAL.md' },
          new inquirer.Separator(),
          { name: '✏️ Custom (type filenames manually)', value: '__CUSTOM__' },
        ],
        default: ['CLAUDE.md'],
      },
    ]);
    selectedAgents = response.selectedAgents;

    let manualList: string[] = [];

    if (selectedAgents.includes('__CUSTOM__')) {
      const { customFiles } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customFiles',
          message: 'Enter file names (comma-separated):',
          default: 'custom.md',
          validate: input => input.trim() !== '' || 'Please enter at least one filename',
        },
      ]);

      manualList = customFiles
        .split(',')
        .map((f: string) => f.trim())
        .filter((f: string) => Boolean(f));
    }

    // Finalize selectedAgents list
    selectedAgents = selectedAgents
      .filter(f => f !== '__CUSTOM__')
      .concat(manualList);

    if (selectedAgents.length === 0) {
      console.log('⚠️ No agent files selected. Please enter filenames manually.');
      const { customFiles } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customFiles',
          message: 'Enter file names (comma-separated):',
          default: 'custom.md',
          validate: input => input.trim() !== '' || 'Please enter at least one filename',
        },
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

  const versionedType = appendTimestamp(selectedType);
  const targetPath = path.join(targetBase, versionedType);

  if (await fs.pathExists(targetPath) && !force) {
    console.log(`⚠️ .dokugent/conventions/${versionedType} already exists. Use --force to overwrite.`);
    return;
  }

  if (selectedType === 'dev') {
    await fs.ensureDir(targetPath);
    for (const agentFile of selectedAgents) {
      const srcPath = path.join('presets/templates/conventions/dev', agentFile);
      const destPath = path.join(targetPath, agentFile);
      console.log(`🛠️ ${agentFile} → ${path.relative(process.cwd(), destPath)}`);

      try {
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
        } else {
          console.log(`⚠️ Template not found for ${agentFile}. Creating placeholder.`);
          await fs.outputFile(destPath, `# ${agentFile}\n\nAdd your conventions here.\n`);
        }
      } catch (err) {
        console.error(`❌ Failed to scaffold ${agentFile}:`, err);
      }
    }
  } else {
    const source = path.join('.dokugent/conventions', selectedType);
    await fs.copy(source, targetPath);
  }

  await updateSymlink(targetBase, selectedType, versionedType);
}