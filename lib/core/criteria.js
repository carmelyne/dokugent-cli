/**
 * Creates or updates a Dokugent agent criteria file.
 * Generates a human-readable criteria.md.
 * Used to define the agent’s constraints, evaluation metrics, and safety rules.
 * Supports --force to overwrite existing files with backups.
 */

import fs from 'fs-extra';
import path from 'path';
import { writeWithBackup } from '../utils/fileWriter.js';
import { resolveVersionedPath } from '../utils/resolveVersionedPath.js';
import inquirer from 'inquirer';

export async function runCriteria({ force = false } = {}) {
  const criteriaDir = path.resolve('.dokugent/criteria');
  await fs.ensureDir(criteriaDir);

  const basePath = criteriaDir;
  const mdPath = resolveVersionedPath(basePath, 'criteria.md');

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
        { name: 'Accuracy', value: 'accuracy', checked: true },
        { name: 'Clarity', value: 'clarity', checked: true },
        { name: 'Relevance', value: 'relevance', checked: true },
        { name: 'Tone', value: 'tone' },
        { name: 'Timeliness', value: 'timeliness' },
      ],
    },
  ]);

  const criteriaMdContent = `# CRITERIA.md

## Success Conditions
${answers.successConditions}

## Failure Conditions
${answers.failureConditions}

## Evaluation Metrics
${answers.metrics.map((m) => `- ${m.charAt(0).toUpperCase() + m.slice(1)}`).join('\n')}
`;

  await writeWithBackup(mdPath, criteriaMdContent);

  console.log('✅ criteria.md created in .dokugent/criteria/');
}

export async function useCriteria(versionedName) {
  const criteriaDir = path.resolve('.dokugent/criteria');
  const resolvedPath = resolveVersionedPath(criteriaDir, versionedName);
  const symlinkPath = path.join(criteriaDir, 'criteria');

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ No matching criteria found for ${versionedName}`);
    return;
  }

  try {
    await fs.remove(symlinkPath);
  } catch { }

  await fs.symlink(resolvedPath, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: criteria → ${path.basename(resolvedPath)}`);
}