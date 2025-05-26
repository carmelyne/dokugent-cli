/**
 * @file conventions-wizard.ts
 * @description Interactive CLI wizard for scaffolding convention folders used by agents.
 * Supports predefined types (dev, writing, research) and custom user-defined configurations.
 */
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';


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

  const { selectedType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedType',
      message: '📚 Pick a convention type to scaffold:',
      choices: availableTypes,
      default: availableTypes.includes('dev') ? 'dev' : 'custom',
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

    const targetPath = path.join(conventionsBase, customName, agentId);

    if (await fs.pathExists(targetPath) && !force) {
      console.log(`⚠️ ${path.relative(process.cwd(), targetPath)} already exists. Use --force to overwrite.`);
      return;
    }

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
    return;
  }

  let selectedAgents: string[] = [];

  if (selectedType === 'dev') {
    const devTargetPath = path.join(conventionsBase, selectedType, agentId);
    await fs.ensureDir(devTargetPath);
    const existingFiles = (await fs.readdir(devTargetPath)).filter(f => f.endsWith('.md'));

    const allChoices = [
      'CLAUDE.md',
      'CODEX.md',
      'GEMINI.md',
      'GPT4.md',
      'GROK.md',
      'LLM-CORE.md',
      'MISTRAL.md',
    ];

    const remainingChoices = allChoices.filter(choice => !existingFiles.includes(choice));

    if (remainingChoices.length === 0) {
      console.log('✅ All default profiles already added. Showing only custom option.');
    }

    const response = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAgents',
        message: '🤖 Select agent profiles to include:',
        choices: [
          ...remainingChoices.map(f => ({ name: f, value: f })),
          new inquirer.Separator(),
          { name: '✏️ Custom (type filenames manually)', value: '__CUSTOM__' },
        ],
        default: remainingChoices.includes('CLAUDE.md') ? ['CLAUDE.md'] : [],
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

  const targetPath = path.join(conventionsBase, selectedType, agentId);

  if (await fs.pathExists(targetPath) && !force) {
    console.log(`📂 Adding to existing folder: ${path.relative(process.cwd(), targetPath)}`);
  }

  if (selectedType === 'dev') {
    await fs.ensureDir(targetPath);

    for (const agentFile of selectedAgents) {
      const srcPath = path.join(baseTemplatePath, 'dev', agentFile);
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
    await fs.ensureDir(targetPath);
    // Create/replace symlink for latest dev convention
    const symlinkPath = path.join(conventionsBase, selectedType, 'latest');
    try {
      await fs.remove(symlinkPath);
    } catch { }
    await fs.symlink(targetPath, symlinkPath, 'dir');
  } else {
    const source = path.join(baseTemplatePath, selectedType);
    if (await fs.pathExists(source)) {
      await fs.copy(source, targetPath);
      console.log(`✅ Convention template copied from: ${source}`);
    } else {
      await fs.ensureDir(targetPath);
      const readmePath = path.join(targetPath, 'README.md');
      await fs.outputFile(readmePath, `# ${selectedType} Conventions\n\nAdd files to this folder as needed.\n`);
      console.log(`⚠️ No template found for "${selectedType}". Created empty folder with README at ${targetPath}`);
    }
  }

  await fs.ensureDir(targetPath);
  // Create/replace symlink for latest convention (non-dev types)
  const symlinkPath = path.join(conventionsBase, selectedType, 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(targetPath, symlinkPath, 'dir');
}
