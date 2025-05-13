/**
 * Handles the setup and management of convention files for different agent types.
 * Copies template conventions into the .dokugent project folder.
 * Supports backup and overwrite via --force flag.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveVersionedPath } from '../utils/resolveVersionedPath.js';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Copies convention template files into the .dokugent/conventions directory.
 * If the target directory exists and --force is provided, backs it up before overwriting.
 *
 * @param {Object} options
 * @param {string} options.type - The convention type (e.g., 'dev').
 * @param {boolean} [options.force=false] - Whether to force overwrite existing conventions.
 */
export async function handleConventions({ type, force = false }) {
  if (!type) {
    const { selectedType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedType',
        message: '📚 Pick a convention type to scaffold:',
        choices: ['dev', 'writing', 'research', 'custom'],
        default: 'dev',
      },
    ]);
    type = selectedType;

    if (type === 'custom') {
      const { customName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customName',
          message: '🆕 Name your custom convention type (e.g., qa, editorial):',
          validate: (input) =>
            /^[a-zA-Z0-9_-]+$/.test(input) || 'Use only letters, numbers, hyphens, or underscores',
        },
      ]);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      type = `${customName}@${timestamp}`;

      const { base } = await inquirer.prompt([
        {
          type: 'list',
          name: 'base',
          message: '📦 Start your custom convention from:',
          choices: ['Blank', 'dev', 'writing', 'research'],
          default: 'Blank',
        },
      ]);

      const baseTemplatePath = path.join(__dirname, '../../presets/templates/conventions');
      const targetBase = path.join(process.cwd(), '.dokugent/conventions');
      const targetPath = path.join(targetBase, type);

      if (await fs.pathExists(targetPath)) {
        console.log(`⚠️  .dokugent/conventions/${type} already exists. Use --force to overwrite.`);
        return;
      }

      if (base === 'Blank') {
        await fs.ensureDir(targetPath);
        console.log(`✅ Created blank custom convention '${type}'`);
      } else {
        const sourcePath = resolveVersionedPath(baseTemplatePath, base);
        await fs.copy(sourcePath, targetPath);
        console.log(`✅ Created custom convention '${type}' from base '${base}'`);
      }

      const symlinkPath = path.join(targetBase, customName);
      try {
        await fs.remove(symlinkPath);
      } catch { }
      await fs.symlink(targetPath, symlinkPath, 'dir');
      console.log(`🔗 Symlink updated: ${customName} → ${path.basename(targetPath)}`);
      return;
    }
  }
  const baseTemplatePath = path.join(__dirname, '../../presets/templates/conventions');
  const templatePath = resolveVersionedPath(baseTemplatePath, type);
  const targetBase = path.join(process.cwd(), '.dokugent/conventions');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const versionedType = `${type}@${timestamp}`;
  const targetPath = path.join(targetBase, versionedType);
  type = versionedType;

  if (await fs.pathExists(targetPath)) {
    if (!force) {
      console.log(`⚠️  .dokugent/conventions/${type} already exists. Use --force to overwrite.`);
      return;
    }

    const backupPath = path.join(targetBase, `${type}-${timestamp}`);
    await fs.move(targetPath, backupPath);
    console.log(`📦 Backed up existing ${type} conventions to ${backupPath}`);
  }

  await fs.copy(templatePath, targetPath);
  console.log(`✅ Copied ${type} conventions to .dokugent/conventions/${type}`);

  const symlinkPath = path.join(targetBase, type.split('@')[0]);
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(targetPath, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: ${type.split('@')[0]} → ${path.basename(targetPath)}`);
}

export async function useConventions(versionedName) {
  const conventionsDir = path.resolve('.dokugent/conventions');
  const resolvedPath = resolveVersionedPath(conventionsDir, versionedName);
  const symlinkPath = path.join(conventionsDir, 'conventions');

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ No matching conventions found for ${versionedName}`);
    return;
  }

  try {
    await fs.remove(symlinkPath);
  } catch { }

  await fs.symlink(resolvedPath, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: conventions → ${path.basename(resolvedPath)}`);
}