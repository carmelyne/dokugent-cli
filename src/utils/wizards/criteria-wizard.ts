/**
 * @file criteria-wizard.ts
 * @description Interactive wizard for defining evaluation criteria for agents,
 * including success/failure conditions and metrics.
 */
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { writeWithBackup } from '../file-writer';
import { resolveActivePath } from '../ls-utils';
import { formatRelativePath } from '../format-path';
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
  const agentPath = await resolveActivePath('agents');
  if (!agentPath) {
    console.error('❌ No active agent profile found.');
    return;
  }
  const fullAgentId = path.basename(agentPath);
  const rawAgentId = fullAgentId.split('@')[0];

  const baseDir = path.resolve('.dokugent/data/criteria');
  await fs.ensureDir(baseDir);

  const versionedFolder = agentPath.replace('/agents/', '/criteria/');
  const mdPath = path.join(versionedFolder, 'criteria.md');


  // Read existing content, if any, to extract already used success conditions
  let existingContent = '';
  if (await fs.pathExists(mdPath)) {
    existingContent = await fs.readFile(mdPath, 'utf-8');
  }
  let existingSuccessConditions: string[] = [];
  const successSections = [...existingContent.matchAll(/## Success Conditions\n([\s\S]*?)(?=\n##|$)/g)];
  existingSuccessConditions = successSections.flatMap(match =>
    match[1]
      .split('\n')
      .map(line => line.replace(/^- /, '').trim())
      .filter(Boolean)
  );

  const successChoices = [
    { name: 'Accurate', value: 'Accurate', checked: true },
    { name: 'Relevant', value: 'Relevant', checked: true },
    { name: 'Follows format guidelines', value: 'Follows format guidelines', checked: true },
    { name: 'Clear and concise', value: 'Clear and concise' },
    { name: 'Provides references', value: 'Provides references' },
  ].filter(choice => {
    return 'value' in choice && !existingSuccessConditions.includes(choice.value);
  });

  if (!successChoices.find(c => c.value === 'custom')) {
    successChoices.push({ name: 'Custom...', value: 'custom' });
  }

  const { selectedSuccessConditions } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSuccessConditions',
      message: '✅ What does a good output look like for this agent?',
      choices: successChoices,
    }
  ]);

  let finalSuccessConditions: string[] = [];
  if (selectedSuccessConditions.length === 0 || selectedSuccessConditions.includes('custom')) {
    const { customSuccess }: { customSuccess: string } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customSuccess',
        message: '✍️ Enter your custom success condition:',
      }
    ]);
    // Remove 'custom' from the list, keep others in order
    const filtered = selectedSuccessConditions.filter((v: string) => v !== 'custom');
    if (customSuccess?.trim()) {
      finalSuccessConditions = [...filtered, customSuccess.trim()];
    } else {
      finalSuccessConditions = filtered;
    }
  } else {
    finalSuccessConditions = selectedSuccessConditions;
  }

  // Parse existing lists
  const extractList = (regex: RegExp) =>
    [...existingContent.matchAll(regex)]
      .flatMap(m =>
        m[1]
          .split('\n')
          .map(line => line.replace(/^- /, '').trim())
          .filter(Boolean)
      );

  const existingSuccess = extractList(/## Success Conditions\n([\s\S]*?)(?=\n##|$)/g);
  const existingFailure = extractList(/## Failure Conditions\n([\s\S]*?)(?=\n##|$)/g);
  const existingMetrics = extractList(/## Evaluation Metrics\n([\s\S]*?)(?=\n##|$)/g);

  const metricChoices = [
    { name: 'Accuracy', value: 'Accuracy', checked: true },
    { name: 'Clarity', value: 'Clarity', checked: true },
    { name: 'Relevance', value: 'Relevance', checked: true },
    { name: 'Tone', value: 'Tone' },
    { name: 'Timeliness', value: 'Timeliness' },
  ].filter(choice => !existingMetrics.includes(choice.value));

  // Always push Custom option at the end
  metricChoices.push({ name: 'Custom...', value: 'custom' });

  const answers: {
    failureConditions: string;
    selectedMetrics: string[];
  } = await inquirer.prompt([
    {
      type: 'input',
      name: 'failureConditions',
      message: '❌ What should this agent never do?',
      default: 'Make unsupported claims or use incorrect format',
    },
    {
      type: 'checkbox',
      name: 'selectedMetrics',
      message: '📊 Select evaluation metrics:',
      choices: metricChoices,
    },
  ]);

  let finalMetrics = answers.selectedMetrics;
  if (finalMetrics.length === 0 || finalMetrics.includes('custom')) {
    const { customMetric }: { customMetric: string } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customMetric',
        message: '✍️ Enter your custom evaluation metric:',
      }
    ]);
    const filtered = finalMetrics.filter((m: string) => m !== 'custom');
    if (customMetric?.trim()) {
      finalMetrics = [...filtered, customMetric.trim()];
    } else {
      finalMetrics = filtered;
    }
  }

  // Merge and dedupe
  const mergedSuccess = Array.from(new Set([...existingSuccess, ...finalSuccessConditions]));
  const mergedFailure = Array.from(new Set([
    ...existingFailure,
    ...answers.failureConditions
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean),
  ]));
  const mergedMetrics = Array.from(new Set([...existingMetrics, ...finalMetrics]));

  // Build clean output
  const mdContent = `# CRITERIA.md

Agent: ${fullAgentId}

## Success Conditions
${mergedSuccess.map(s => `- ${s}`).join('\n')}

## Failure Conditions
${mergedFailure.map(s => `- ${s}`).join('\n')}

## Evaluation Metrics
${mergedMetrics.map(m => `- ${m}`).join('\n')}
`;

  await fs.ensureDir(versionedFolder);
  await writeWithBackup(mdPath, mdContent);

  const symlinkPath = path.join(baseDir, 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(versionedFolder, symlinkPath, 'dir');

  console.log(`\n✅ criteria.md created in\n   ${formatRelativePath(versionedFolder)}/\n`);
  console.log(`🔗 Symlink updated:\n   criteria → ${path.basename(versionedFolder)}\n`);
}
