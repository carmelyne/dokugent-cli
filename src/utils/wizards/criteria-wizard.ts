/**
 * @file criteria-wizard.ts
 * @description Interactive wizard for defining evaluation criteria for agents,
 * including success/failure conditions and metrics.
 */
import { prompt } from 'enquirer';
import path from 'path';
import fs from 'fs-extra';
import { writeWithBackup } from '../file-writer';
import { resolveActivePath } from '../ls-utils';
import { formatRelativePath } from '@utils/format-path';
import { estimateTokensFromText } from '../tokenizer';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';
import { wrapWithHangingIndent } from '@utils/cli/wrap-utils';
import chalk from 'chalk';

const DEFAULT_SCOPE = "Summarization of English-language educational content, limited to 1000 tokens per task.";

const DEFAULT_CONSTRAINTS = [
  "Avoid speculation unless explicitly prompted",
  "Must not exceed token limit of target LLM"
];

const DEFAULT_METRIC_WEIGHTS = {
  Accuracy: 0.4,
  Clarity: 0.25,
  Relevance: 0.2,
  Tone: 0.1,
  Timeliness: 0.05
};

const DEFAULT_USE_CASE = "educational summarization";

interface CriteriaAnswers {
  selectedSuccessConditions: string[];
  failureConditions: string;
  selectedMetrics: string[];
  customSuccess?: string;
  customMetric?: string;
}

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
    { name: 'Accurate', message: padQuestion('Accurate'), initial: true },
    { name: 'Relevant', message: padQuestion('Relevant'), initial: true },
    { name: 'Follows format guidelines', message: padQuestion('Follows format guidelines'), initial: true },
    { name: 'Clear and concise', message: padQuestion('Clear and concise') },
    { name: 'Provides references', message: padQuestion('Provides references') },
  ].filter(choice => {
    return !existingSuccessConditions.includes(choice.name);
  });

  if (!successChoices.find(c => c.name === 'Custom...')) {
    successChoices.push({ name: 'Custom...', message: padQuestion('Custom...') });
  }

  let selectedSuccessConditions: string[] = [];
  try {
    const successPromptResult = await prompt<{ selectedSuccessConditions: string[] }>([
      {
        type: 'multiselect',
        name: 'selectedSuccessConditions',
        message: padQuestion('✅ What does a good output look like for this agent?'),
        choices: successChoices,
      }
    ]);
    selectedSuccessConditions = (successPromptResult as any).selectedSuccessConditions;
    if (!selectedSuccessConditions || selectedSuccessConditions.length === 0) {
      paddedLog('Bye...', 'No success conditions were selected. Cancelling criteria wizard.', PAD_WIDTH, 'warn', 'EXITED');
      console.log();
      return;
    }
  } catch (err) {
    paddedLog('Cancelled', 'No input received. Criteria wizard aborted.', PAD_WIDTH, 'warn', 'EXITED');
    console.log();
    return;
  }

  let finalSuccessConditions: string[] = [];
  if (selectedSuccessConditions.length === 0 || selectedSuccessConditions.includes('Custom...')) {
    const customSuccessPromptResult = await prompt<{ customSuccess: string }>([
      {
        type: 'input',
        name: 'customSuccess',
        message: padQuestion('Enter your custom success condition:'),
        initial: 'Response includes at least one citation',
        validate: (input: string) =>
          input.trim() === '' ? 'Custom success condition cannot be empty.' : true,
      },
    ]);
    const customSuccess = customSuccessPromptResult.customSuccess;
    // Remove 'Custom...' from the list, keep others in order
    const filtered = selectedSuccessConditions.filter((v: string) => v !== 'Custom...');
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
    { name: 'Accuracy', message: padQuestion('Accuracy'), initial: true },
    { name: 'Clarity', message: padQuestion('Clarity'), initial: true },
    { name: 'Relevance', message: padQuestion('Relevance'), initial: true },
    { name: 'Tone', message: padQuestion('Tone') },
    { name: 'Timeliness', message: padQuestion('Timeliness') },
  ].filter(choice => !existingMetrics.includes(choice.name));

  // Always push Custom option at the end
  metricChoices.push({ name: 'Custom...', message: padQuestion('Custom...') });

  const failurePromptResult = await prompt<Pick<CriteriaAnswers, 'failureConditions'>>([
    {
      type: 'input',
      name: 'failureConditions',
      message: padQuestion('❌ What should this agent never do?'),
      initial: 'Make unsupported claims or use incorrect format',
    },
  ]);
  const failureConditions = failurePromptResult.failureConditions;

  const metricsPromptResult = await prompt<{ selectedMetrics: string[] }>([
    {
      type: 'multiselect',
      name: 'selectedMetrics',
      message: padQuestion('📊 Select evaluation metrics:'),
      choices: metricChoices,
    }
  ]);
  const selectedMetrics = (metricsPromptResult as any).selectedMetrics;

  const answers = {
    failureConditions,
    selectedMetrics,
  };

  let finalMetrics = answers.selectedMetrics;
  if (finalMetrics.length === 0 || finalMetrics.includes('Custom...')) {
    const customMetricPromptResult = await prompt<{ customMetric: string }>([
      {
        type: 'input',
        name: 'customMetric',
        message: padQuestion('✍️ Enter your custom evaluation metric:'),
        initial: 'Clarity of explanation',
        validate: (input: string) =>
          input.trim() === '' ? 'Custom evaluation metric cannot be empty.' : true,
      },
    ]);
    const customMetric = customMetricPromptResult.customMetric;
    const filtered = finalMetrics.filter((m: string) => m !== 'Custom...');
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
      .map((s: string) => s.trim())
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
    cliVersion: DOKUGENT_CLI_VERSION,
    schemaVersion: DOKUGENT_SCHEMA_VERSION,
    createdVia: DOKUGENT_CREATED_VIA,
    estimatedTokens: 0, // will be updated below
    Scope: DEFAULT_SCOPE,
    Constraints: DEFAULT_CONSTRAINTS,
    MetricWeights: DEFAULT_METRIC_WEIGHTS,
    useCase: DEFAULT_USE_CASE,
    "Success Conditions": mergedSuccess,
    "Failure Conditions": mergedFailure,
    "Evaluation Metrics": mergedMetrics,
  };
  const estimatedTokens = estimateTokensFromText(JSON.stringify(jsonContent, null, 2));
  jsonContent.estimatedTokens = estimatedTokens;

  await writeWithBackup(jsonPath, JSON.stringify(jsonContent, null, 2));
  // console.log(`\n📄 criteria.json created at\n   ${formatRelativePath(jsonPath)}\n`);
  paddedLog('File', `${formatRelativePath(jsonPath)}`, PAD_WIDTH, 'success', 'SAVED');

  const symlinkPath = path.join(baseDir, 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(versionedFolder, symlinkPath, 'dir');

  paddedLog('Symlink path', `criteria → ${path.basename(versionedFolder)}`, PAD_WIDTH, 'purple', 'SYMLINK');
  paddedLog('Token Estimate', `~${estimatedTokens} tokens`, PAD_WIDTH, 'magenta', 'TOKENS');
  paddedLog('To check agent criteria', `dokugent criteria --check ${fullAgentId}`, PAD_WIDTH, 'blue', 'HELP');
  console.log();

  // Optionally, you could estimate tokens from the JSON file if needed.
  // Otherwise, removed token estimation log.
}
