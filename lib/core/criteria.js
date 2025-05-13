/**
 * Creates or updates a Dokugent agent criteria file.
 * Generates both a human-readable criteria.md and machine-readable criteria.yaml.
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
  const yamlPath = resolveVersionedPath(basePath, 'criteria.yaml');

  if (!force && (await fs.pathExists(mdPath) || await fs.pathExists(yamlPath))) {
    console.log('⚠️ criteria.md or criteria.yaml already exists. Use --force to overwrite.');
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

  const criteriaYamlContent = `success_conditions:
  - ${answers.successConditions}

failure_conditions:
  - ${answers.failureConditions}

metrics:
${answers.metrics
      .map((m) => `  - name: ${m}\n    weight: ${1 / answers.metrics.length}`)
      .join('\n')}
`;

  await writeWithBackup(mdPath, criteriaMdContent);
  await writeWithBackup(yamlPath, criteriaYamlContent);

  console.log('✅ criteria.md and criteria.yaml created in .dokugent/criteria/');
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