/**
 * Initializes a new Dokugent CLI project.
 * Sets up default folder structure and starter Markdown files.
 * Typically the first command to run in a new workflow.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { folderGroups } from '../config/scaffold-groups.js';
import { expectedInitFiles } from '../config/fileStructure.js';
import yaml from 'js-yaml';
import { writeWithBackup } from '../utils/fileWriter.js';
import { backupFolderIfExists } from '../utils/folderBackup.js';
import inquirer from 'inquirer';
import { runWizard } from './wizard.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureBaseFolders() {
  const root = path.resolve('.dokugent');
  const folders = ['conventions', 'plan', 'criteria', 'agent-tools'];
  for (const folder of folders) {
    const dirPath = path.join(root, folder);
    await fs.ensureDir(dirPath);
    const marker = path.join(dirPath, '.gitkeep');
    await fs.outputFile(marker, '');
  }
}

export async function initCore(group, force = false) {
  await backupFolderIfExists('.dokugent', force);
  await ensureBaseFolders();
  const sourceDir = path.resolve(__dirname, `../../presets/templates/conventions/${group}`);
  const targetDir = path.resolve('.dokugent');

  const folders = await fs.readdir(sourceDir);
  for (const folder of folders) {
    const folderPath = path.join(sourceDir, folder);
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const sourceFile = path.join(folderPath, file);
      const targetFile = path.join(targetDir, folder, file);
      const contents = await fs.readFile(sourceFile, 'utf-8');
      await writeWithBackup(targetFile, contents);
    }
  }
}

export async function init(force = false) {
  await backupFolderIfExists('.dokugent', force);
  await ensureBaseFolders();
  const examplesDir = path.resolve(__dirname, '../../presets/templates/init');
  const dokugentDir = path.resolve('.dokugent');

  for (const file of expectedInitFiles) {
    const sourceFile = path.join(examplesDir, file);
    const targetFile = path.join(dokugentDir, file);
    const contents = await fs.readFile(sourceFile, 'utf-8');
    await fs.ensureDir(path.dirname(targetFile));
    await writeWithBackup(targetFile, contents);
  }
  console.log('Initialized base .dokugent folder structure.');

  const { launchWizard } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'launchWizard',
      message: 'Would you like to run the interactive wizard now to configure your agent or app and set up project files?',
      default: true
    }
  ]);

  if (launchWizard) {
    await runWizard();
  }
}