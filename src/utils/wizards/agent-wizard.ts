/**
 * @file init-wizard.ts
 * @description Interactive CLI wizard for initializing a new Dokugent agent.
 * Generates agent-spec.md and agent-spec.json files, along with tool lists and denylist files.
 */

import { prompt } from 'enquirer';
import fs from 'fs-extra';
import path from 'path';
import { confirmAndWriteFile } from '../fs-utils';
import { getTimestamp } from '../timestamp';
import { estimateTokensFromText } from '../tokenizer';
import chalk from 'chalk';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';
import { formatRelativePath } from '@utils/format-path';
import { DOKUGENT_CLI_VERSION, DOKUGENT_SCHEMA_VERSION, DOKUGENT_CREATED_VIA } from '@constants/schema';

export interface InitAnswers {
  agentName: string;
  description: string;
  roles: string[];
  processableTypes: string[];
  mainTask: string;
  requiresConventions: boolean;
  ecosystem: string;
  avatar?: string;
  birth: string;
  createdAt: string;
  createdAtDisplay: string;
  steps: string[];
  llmTargets: string[];
}

/**
 * Launches the interactive or default agent initialization wizard.
 * If `useDefaultsOnly` is true, skips prompts and scaffolds with default values.
 *
 * Responsibilities:
 * - Prompts for agent name, roles, protocols, outputs, and security options.
 * - Writes `agent-spec.md`, `agent-spec.json`, `tool-list.md`, and denylist entries.
 * - Supports both interactive and non-interactive `--yes` mode.
 *
 * @param useDefaultsOnly Whether to skip prompts and use default agent configuration.
 * @returns {Promise<InitAnswers>} The full set of answers used to scaffold the agent.
 */
export async function promptAgentWizard(useDefaultsOnly = false): Promise<InitAnswers> {
  try {
    if (useDefaultsOnly) {
      const now = new Date();
      const defaults: InitAnswers = {
        agentName: 'default-agent',
        description: 'An AI agent scaffolded with default settings.',
        roles: ['summarizer'],
        processableTypes: ['english', 'markdown structure'],
        mainTask: 'Summarize input as 3 bullet points',
        requiresConventions: false,
        ecosystem: 'none',
        avatar: '',
        birth: getTimestamp(),
        createdAt: now.toISOString(), // ISO 8601 string for data reliability
        createdAtDisplay: now.toLocaleString(), // Human-friendly format
        steps: [],
        llmTargets: ['gpt-4', 'claude-3', 'gemini-1.5'],
      };

      return defaults;
    }
    console.log('[wizard] launching interactive prompt...');
    const baseAnswers: any = await prompt([
      {
        type: 'input',
        name: 'agentName',
        message: padQuestion('What is the name of this agent?'),
        initial: 'summarybot',
        validate: (input: string) =>
          input.trim().length > 0 ? true : 'Agent name cannot be blank.',
      },
      {
        type: 'input',
        name: 'description',
        message: padQuestion('Briefly describe what this agent should do:'),
        initial: 'Assists with summarizing input text',
      },
      {
        type: 'select',
        name: 'role',
        message: padQuestion('What role will this agent perform?'),
        choices: [
          padQuestion('summarizer'),
          padQuestion('formatter'),
          padQuestion('validator'),
          padQuestion('router'),
          padQuestion('wizard'),
          padQuestion('other'),
        ],
        result: (input: string) => input.trim(),
      }
    ]);

    const role = baseAnswers.role;

    const extraAnswers: any = await prompt([
      {
        type: 'input',
        name: 'customRole',
        message: padQuestion('Enter the name of the custom role:'),
        skip: () => {
          // console.log('[wizard] role value:', role);
          return role !== 'other';
        },
        result: (input: string) => input.trim(),
      },
      {
        type: 'input',
        name: 'processableTypes',
        message: padQuestion('Content Types Accepted (comma-separated):'),
        initial: 'english, markdown structure',
        result: (input: string) => input,
      },
      {
        type: 'input',
        name: 'llmTargets',
        message: padQuestion('Which LLM targets should this agent support? (comma-separated)'),
        initial: 'gpt-4, claude-3, gemini-1.5',
        format: (input: string) =>
          input.split(',').map(s => s.trim()).filter(Boolean).join(', ')
      },
      {
        type: 'input',
        name: 'avatar',
        message: padQuestion('Provide an avatar URL or description (optional):'),
        initial: '',
      },
      {
        type: 'input',
        name: 'mainTask',
        message: padQuestion('What is the main task of this agent?'),
        initial: 'Summarize input as 3 bullet points',
      },
      {
        type: 'confirm',
        name: 'requiresConventions',
        message: padQuestion('Does this agent require behavioral conventions?'),
        initial: false,
      },
      {
        type: 'select',
        name: 'ecosystem',
        message: padQuestion('Which ecosystem does this agent align with?'),
        choices: [
          padQuestion('none'),
          padQuestion('nvidia'),
          padQuestion('openai'),
          padQuestion('anthropic'),
          padQuestion('google'),
          padQuestion('microsoft'),
        ],
        initial: 0,
        validate: (input: string) =>
          input?.trim().length > 0
            ? true
            : chalk.red('✖ Please select an ecosystem option.'),
      },
      {
        type: 'input',
        name: 'steps',
        message: padQuestion('List step IDs for this agent (comma-separated):'),
        initial: '',
        result: (input: string) => input,
      },
    ]);

    const answers = { ...baseAnswers, ...extraAnswers };

    if ((answers.role === 'other' || (answers.roles && Array.isArray(answers.roles) && answers.roles[0] === 'other')) && answers.customRole) {
      answers.role = answers.customRole;
      answers.roles = [answers.customRole];
    }

    // Sanitize all string fields: trim and collapse whitespace
    Object.entries(answers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        (answers as any)[key] = value.trim().replace(/\s+/g, ' ');
      }
    });

    answers.processableTypes = answers.processableTypes.split(',').map((s: string) => s.trim()).filter(Boolean);
    answers.steps = answers.steps
      ? answers.steps.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    // console.log('[wizard] parsed content types:', answers.processableTypes);

    const timestamp = getTimestamp();
    const now = new Date();

    const summaryText = [
      answers.agentName,
      answers.description,
      [answers.role].join(', '),
      answers.processableTypes.join(', '),
      answers.mainTask
    ].join(' ');

    const tokenCount = estimateTokensFromText(summaryText);

    const typedAnswers: InitAnswers & {
      cliVersion: string;
      schemaVersion: string;
      createdVia: string;
      estimatedTokens: number;
    } = {
      agentName: answers.agentName,
      description: answers.description,
      roles: [answers.role],
      processableTypes: answers.processableTypes,
      mainTask: answers.mainTask,
      requiresConventions: answers.requiresConventions,
      ecosystem: answers.ecosystem,
      llmTargets: answers.llmTargets,
      avatar: answers.avatar || '',
      birth: timestamp,
      createdAt: now.toISOString(),
      createdAtDisplay: now.toLocaleString(),
      cliVersion: DOKUGENT_CLI_VERSION,
      schemaVersion: DOKUGENT_SCHEMA_VERSION,
      createdVia: DOKUGENT_CREATED_VIA,
      estimatedTokens: tokenCount,
      steps: answers.steps,
    };

    const agentId = `${typedAnswers.agentName}@${timestamp}`;
    const agentFolder = path.resolve('.dokugent/data/agents', agentId);
    const identityPath = path.join(agentFolder, 'identity.json');

    // Update 'latest' symlink to point to the most recent agent folder
    const latestSymlinkPath = path.resolve('.dokugent/data/agents', 'latest');
    try {
      fs.unlinkSync(latestSymlinkPath); // Force remove even if broken
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).code !== 'ENOENT') {
        paddedLog('Failed to remove old latest symlink', `${err.message}`, PAD_WIDTH, 'warn', 'FAILED');
      } else if (!(err instanceof Error)) {
        paddedLog('Failed to remove old latest symlink', `${String(err)}`, PAD_WIDTH, 'warn', 'FAILED');
      }
    }
    try {
      fs.symlinkSync(agentFolder, latestSymlinkPath, 'dir');
    } catch (err: unknown) {
      if (err instanceof Error) {
        paddedLog('Failed to create latest symlink', `${err.message}`, PAD_WIDTH, 'warn', 'FAILED');
      } else {
        paddedLog('Failed to create latest symlink', `${String(err)}`, PAD_WIDTH, 'warn', 'FAILED');
      }
    }

    fs.ensureDirSync(agentFolder);
    //complete files and folder structure on this timestamp
    // paddedLog('File', formatRelativePath(identityPath), PAD_WIDTH, 'success', 'SAVED');
    await confirmAndWriteFile(identityPath, JSON.stringify(typedAnswers, null, 2));

    // Auto-create plan step stubs from listed step IDs
    const stepDir = path.resolve('.dokugent/data/plans', agentId, 'steps');
    await fs.ensureDir(stepDir);

    const planIndexPath = path.resolve('.dokugent/data/plans', agentId, 'plan.index.md');
    const existingIndex = (await fs.pathExists(planIndexPath))
      ? (await fs.readFile(planIndexPath, 'utf-8')).split('\n')
      : [];

    const indexUpdates: string[] = [];

    for (const stepId of typedAnswers.steps) {
      const stepPath = path.join(stepDir, `${stepId}.json`);
      const placeholder = {
        id: stepId,
        use: 'tool-name-here',
        input: `mocks/${stepId}/input.md`,
        output: `mocks/${stepId}/output.md`
      };
      await fs.writeJson(stepPath, placeholder, { spaces: 2 });

      if (!existingIndex.some(line => line.startsWith(`${stepId} -`))) {
        indexUpdates.push(`${stepId} - linked`);
      }
    }

    if (indexUpdates.length > 0) {
      await fs.writeFile(planIndexPath, [...existingIndex, ...indexUpdates].join('\n'), 'utf-8');
    }

    if (typedAnswers.ecosystem && typedAnswers.ecosystem !== 'none') {
      const presetPath = path.resolve('src/presets/ecosystems', typedAnswers.ecosystem);
      const targetEcosystemPath = path.join(agentFolder, 'ecosystems', typedAnswers.ecosystem);
      if (fs.existsSync(presetPath)) {
        fs.ensureDirSync(targetEcosystemPath);
        fs.copySync(presetPath, targetEcosystemPath, { overwrite: false });
        paddedLog(`Included`, `.dokugent/data/agents/${agentId}/ecosystems/${typedAnswers.ecosystem}`, PAD_WIDTH, `blue`, `PRESETS`);
      } else {
        paddedLog('Preset path not found', formatRelativePath(presetPath), PAD_WIDTH, 'warn', 'PRESETS');
      }
    }

    // const tokenCount = estimateTokensFromText(summaryText);
    paddedLog('Estimated agent profile tokens', `~${tokenCount} tokens`, PAD_WIDTH, 'pink', 'TOKENS');

    if (!typedAnswers.ecosystem || typedAnswers.ecosystem === 'none') {
      paddedLog('To see a list available agents', `dokugent agent --ls`, PAD_WIDTH, 'blue', 'HELP');
    }
    console.log()
    console.log(padMsg(`Agent ${typedAnswers.agentName} initialized with ${tokenCount} tokens.`));
    console.log()
    return typedAnswers;
  } catch (error: any) {
    if (error === '' || error === null || error?.message === 'cancelled' || error?.message === 'Prompt cancelled') {
      paddedLog('Bye...', 'Agent identity prompt cancelled or failed', PAD_WIDTH, 'warn', 'EXITED');
      console.log()
      process.exit(0);
    }

    paddedLog('Agent identity error', `${error.message || error}`, PAD_WIDTH, 'error', 'FAILED');
    console.log()
    process.exit(1);
  }
}
