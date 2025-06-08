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
import { estimateTokensFromText } from '../tokenizer';
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
  const jsonPath = path.join(versionedFolder, 'criteria.json');
  let criteriaData: any = {};
  if (await fs.pathExists(jsonPath)) {
    const raw = await fs.readFile(jsonPath, 'utf-8');
    try {
      criteriaData = raw.trim() === '' ? {} : JSON.parse(raw);
    } catch (err) {
      console.warn('⚠️ Could not parse criteria.json. Starting fresh.');
      criteriaData = {};
    }
  }
  const existingSuccessConditions = criteriaData['Success Conditions'] || [];
  const existingFailureConditions = criteriaData['Failure Conditions'] || [];
  const existingMetricsConditions = criteriaData['Evaluation Metrics'] || [];
  const existingMetrics = existingMetricsConditions;

  const extractList = (_: any) => []; // No longer used

  if (existingContent) {
    console.log(`\n📌 Using agent assigned as current:\n   ${fullAgentId}`);
    console.log(`\n🧾 Existing criteria in\n    → ${formatRelativePath(mdPath)}\n`);

    const printSection = (title: string, entries: string[]) => {
      if (entries.length) {
        console.log(`## ${title}`);
        entries.forEach(e => console.log(`- ${e}`));
        console.log('');
      }
    };

    printSection('Success Conditions', existingSuccessConditions);
    printSection('Failure Conditions', existingFailureConditions);
    printSection('Evaluation Metrics', existingMetrics);
  }

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
        message: 'Enter your custom success condition:',
        default: 'Response includes at least one citation',
        validate: (input: string) =>
          input.trim() === '' ? 'Custom success condition cannot be empty.' : true,
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
  const existingSuccess = existingSuccessConditions;
  const existingFailure = existingFailureConditions;

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
        default: 'Clarity of explanation',
        validate: (input: string) =>
          input.trim() === '' ? 'Custom evaluation metric cannot be empty.' : true,
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

  // Build clean output (removed mdContent and writing criteria.md)
  await fs.ensureDir(versionedFolder);

  const now = new Date();

  // Write criteria.json alongside criteria.md with backup
  const jsonContent = {
    createdAt: now.toISOString(),
    createdAtDisplay: now.toLocaleString(),
    lastModifiedAt: now.toISOString(),
    lastModifiedAtDisplay: now.toLocaleString(),
    estimatedTokens: 0, // will be updated below
    "Success Conditions": mergedSuccess,
    "Failure Conditions": mergedFailure,
    "Evaluation Metrics": mergedMetrics,
  };
  const estimatedTokens = estimateTokensFromText(JSON.stringify(jsonContent, null, 2));
  jsonContent.estimatedTokens = estimatedTokens;

  await writeWithBackup(jsonPath, JSON.stringify(jsonContent, null, 2));
  console.log(`\n📄 criteria.json created at\n   ${formatRelativePath(jsonPath)}\n`);

  const symlinkPath = path.join(baseDir, 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(versionedFolder, symlinkPath, 'dir');

  // Removed criteria.md confirmation log
  console.log(`🔗 Symlink updated:\n   criteria → ${path.basename(versionedFolder)}\n`);

  // Optionally, you could estimate tokens from the JSON file if needed.
  // Otherwise, removed token estimation log.
}
