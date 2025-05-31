import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import minimist from 'minimist';

export async function resolveCertIdentity(argv: string | string[] = ''): Promise<{ id: string; valid: string }> {
  const args = Array.isArray(argv)
    ? minimist(argv)
    : minimist(argv?.trim()?.length ? argv.split(' ') : []);

  const tempCertInfoPath = path.join('.dokugent', 'ops', 'temp', 'cert-info.json');

  // Variables to hold values from args and saved file
  let initialIdFromArgs: string | undefined = args.id;
  let initialValidFromArgs: string | undefined = args.valid;

  let savedId: string | undefined;
  let savedValid: string | undefined;

  // Attempt to load saved identity from temp file
  try {
    const saved = JSON.parse(await fs.readFile(tempCertInfoPath, 'utf8'));
    savedId = saved.id;
    savedValid = saved.valid;
  } catch (error) {
    // If file doesn't exist or is corrupted, silently fallback
    // console.error(`Debug: Could not read cert-info.json or it's corrupted: ${error.message}`);
  }

  // Determine the current effective values, prioritizing arguments over saved file
  let currentId: string | undefined = initialIdFromArgs || savedId;
  let currentValid: string | undefined = initialValidFromArgs || savedValid;

  // Trigger the prompt wizard if either identity or validity is missing
  // or if we want to confirm/re-set them explicitly (e.g., if a previous value was only a default)
  if (!currentId || !currentValid) {
    const owners = await fs.readdir(path.join('.dokugent', 'keys', 'owners'));
    // Filter out hidden files like .DS_Store that might appear from fs.readdir
    const ownerChoices = owners
      .filter(owner => !owner.startsWith('.'))
      .map(owner => ({ name: owner, value: owner }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'id', // Use 'id' to directly match the return object property
        message: '🪪 Who should be used as signing identity?',
        choices: ownerChoices,
        default: currentId, // Pre-fill with currentId if available
      },
      {
        type: 'input',
        name: 'valid', // Use 'valid' to directly match the return object property
        message: '📅 Set certificate validity period (e.g. 6m, 1y)',
        default: currentValid || '6m', // Pre-fill with currentValid or default to '6m'
      },
    ]);

    // Update current values with user's answers from the prompt
    currentId = answers.id;
    currentValid = answers.valid;

    // Save the newly obtained or confirmed identity info for future runs
    await fs.mkdir(path.dirname(tempCertInfoPath), { recursive: true });
    await fs.writeFile(tempCertInfoPath, JSON.stringify({ id: currentId, valid: currentValid }, null, 2));
  }

  // Ensure that both id and valid are defined before returning
  if (!currentId || !currentValid) {
    throw new Error('Failed to determine a complete certificate identity and validity from arguments, saved file, or user input.');
  }

  return { id: currentId, valid: currentValid };
}
