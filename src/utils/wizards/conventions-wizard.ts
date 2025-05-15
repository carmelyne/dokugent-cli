import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { appendTimestamp } from '../timestamp';
import { updateSymlink } from '../symlink-utils';

export async function promptConventionsWizard(force = false) {
  const baseTemplatePath = path.join(process.cwd(), 'presets/templates/conventions');
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

  const versionedType = appendTimestamp(selectedType);
  const targetPath = path.join(targetBase, versionedType);

  if (await fs.pathExists(targetPath) && !force) {
    console.log(`⚠️ .dokugent/conventions/${versionedType} already exists. Use --force to overwrite.`);
    return;
  }

  if (selectedType === 'dev') {
    let { selectedAgents } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAgents',
        message: '🤖 Select agent profiles to include:',
        choices: [
          'CLAUDE.md', 'CODEX.md', 'GEMINI.md', 'GPT4.md',
          'GROK.md', 'LLM-CORE.md', 'MISTRAL.md',
          new inquirer.Separator(),
          '✏️ Custom (type filenames manually)'
        ],
        default: ['CLAUDE.md'],
      },
    ]);
    if (selectedAgents.includes('✏️ Custom (type filenames manually)')) {
      const { customFiles } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customFiles',
          message: 'Enter file names (comma-separated):',
          validate: input => input.trim() !== '' || 'Please enter at least one filename',
        },
      ]);
      const manualList = customFiles.split(',').map((f: string) => f.trim()).filter((f: string) => Boolean(f));
      selectedAgents = selectedAgents.filter((f: string) => f !== '✏️ Custom (type filenames manually)').concat(manualList);
    }

    await fs.ensureDir(targetPath);
    for (const agentFile of selectedAgents) {
      await fs.copy(
        path.join(baseTemplatePath, 'dev', agentFile),
        path.join(targetPath, agentFile)
      );
    }
  } else {
    const source = path.join(baseTemplatePath, selectedType);
    await fs.copy(source, targetPath);
  }

  await updateSymlink(targetBase, selectedType, versionedType);
}