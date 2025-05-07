import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { runWizard } from '../core/wizard.js';

export async function backupFolderIfExists(folderPath, force = false) {
  const exists = await fs.pathExists(folderPath);
  if (exists && !force) {
    console.log(`⚠️  .dokugent folder already exists.`);

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

    process.exit(0);
  }
  if (exists && force) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(`.dokugent-backup-${timestamp}`);
    await fs.move(folderPath, backupPath);
    return { moved: true, to: backupPath };
  }
  return { moved: false };
}