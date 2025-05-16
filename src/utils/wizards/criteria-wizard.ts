/**
 * @file criteria-wizard.ts
 * @description Interactive wizard for defining evaluation criteria for agents,
 * including success/failure conditions and metrics.
 */
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { writeWithBackup } from '../file-writer';
import { appendTimestamp } from '../timestamp';

/**
 * Launches an interactive CLI wizard to define criteria for evaluating agent outputs.
 * Captures success conditions, failure conditions, and performance metrics.
 *
 * Responsibilities:
 * - Prompts user to describe good and bad agent behaviors.
 * - Allows selection of relevant evaluation metrics.
 * - Writes a timestamped `criteria.md` and symlinks the latest version.
 *
 * @param force Whether to overwrite the existing criteria.md without confirmation.
 * @returns {Promise<void>}
 */
export async function promptCriteriaWizard(force = false) {
  const baseDir = path.resolve('.dokugent/criteria');
  await fs.ensureDir(baseDir);

  const versionedFolder = path.join(baseDir, appendTimestamp('criteria'));
  const mdPath = path.join(versionedFolder, 'criteria.md');

  if (!force && (await fs.pathExists(mdPath))) {
    console.log('⚠️ criteria.md already exists. Use --force to overwrite.');
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'successConditions',
      message: '✅ What does a good output look like for this agent?',
      default: 'Accurate, relevant, and follows format guidelines',
    },
    {
      type: 'input',
      name: 'failureConditions',
      message: '❌ What should this agent never do?',
      default: 'Make unsupported claims or use incorrect format',
    },
    {
      type: 'checkbox',
      name: 'metrics',
      message: '📊 Select evaluation metrics:',
      choices: [
        { name: 'Accuracy', value: 'Accuracy', checked: true },
        { name: 'Clarity', value: 'Clarity', checked: true },
        { name: 'Relevance', value: 'Relevance', checked: true },
        { name: 'Tone', value: 'Tone' },
        { name: 'Timeliness', value: 'Timeliness' },
      ],
    },
  ]);

  const mdContent = `# CRITERIA.md

## Success Conditions
${answers.successConditions}

## Failure Conditions
${answers.failureConditions}

## Evaluation Metrics
${answers.metrics.map((m: string) => `- ${m}`).join('\n')}
`;

  await fs.ensureDir(versionedFolder);
  await writeWithBackup(mdPath, mdContent);

  const symlinkPath = path.join(baseDir, 'criteria');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(versionedFolder, symlinkPath, 'dir');

  console.log(`✅ criteria.md created in ${versionedFolder}/`);
  console.log(`🔗 Symlink updated: criteria → ${path.basename(versionedFolder)}`);
}