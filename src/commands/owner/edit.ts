import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { exec } from 'child_process';

export async function runOwnerEdit(): Promise<void> {
  const ownersDir = path.resolve('.dokugent/data/owners');

  try {
    const files = await fs.readdir(ownersDir);
    const ownerFiles = files.filter(file => file.startsWith('owner.') && file.endsWith('.json'));

    if (ownerFiles.length === 0) {
      console.log('⚠️ No owner profiles found in .dokugent/data/owners.');
      return;
    }

    const { selectedFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFile',
        message: '👤 Select an owner profile to view/edit:',
        choices: ownerFiles,
      }
    ]);

    const filepath = path.join(ownersDir, selectedFile);
    exec(`code "${filepath}"`);
    const content = await fs.readFile(filepath, 'utf-8');
    const owner = JSON.parse(content);
    console.log('🔍 Current Owner Data:\n', owner);
    // TODO: Add interactive or flag-based editing here
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Failed to process owner profiles:', error.message);
    } else {
      console.error('❌ Failed to process owner profiles:', error);
    }
  }
}
