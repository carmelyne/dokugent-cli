/**
 * @file fs-utils.ts
 * @description Provides a helper function for safely writing to a file with optional overwrite confirmation.
 * Prompts the user before overwriting existing files unless explicitly bypassed.
 */
import fs from 'fs-extra';
import inquirer from 'inquirer';

/**
 * Prompts the user to confirm before overwriting a file, then writes the specified content.
 *
 * Responsibilities:
 * - Checks if the file already exists.
 * - Prompts the user via CLI to confirm overwrite.
 * - Skips writing if user declines.
 * - Writes or overwrites the file if confirmed or not present.
 *
 * @param filepath - Path to the file to write.
 * @param contents - Contents to write (string or Buffer).
 * @returns {Promise<void>}
 */
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