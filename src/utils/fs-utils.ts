import fs from 'fs-extra';
import inquirer from 'inquirer';

export async function confirmAndWriteFile(filepath: string, contents: string | Buffer): Promise<void> {
  const exists = await fs.pathExists(filepath);

  if (exists) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `⚠️ ${filepath} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(`❌ Skipped: ${filepath}`);
      return;
    }
  }

  await fs.outputFile(filepath, contents);
  console.log(`✅ Saved: ${filepath}`);
}