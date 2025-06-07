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
      const defaults: InitAnswers = {
        agentName: 'default-agent',
        description: 'An AI agent scaffolded with default settings.',
        roles: ['summarizer'],
        processableTypes: ['english', 'markdown structure'],
        mainTask: 'Summarize input as 3 bullet points',
        requiresConventions: false,
        ecosystem: 'none',
        avatar: '',
        birth: getTimestamp()
      };

      return defaults;
    }
    const answers: any = await prompt([
      {
        type: 'input',
        name: 'agentName',
        message: padQuestion('What is the name of this agent?'),
        initial: 'summarybot',
        validate: (input: string) => input.trim().length > 0 ? true : 'Agent name cannot be blank.'
      },
      {
        type: 'input',
        name: 'description',
        message: padQuestion('Briefly describe what this agent should do:'),
        initial: 'Assists with summarizing input text'
      },
      {
        type: 'multiselect',
        name: 'roles',
        message: padQuestion('What roles will this agent perform?'),
        choices: [
          { name: 'summarizer', message: padQuestion('summarizer') },
          { name: 'formatter', message: padQuestion('formatter') },
          { name: 'validator', message: padQuestion('validator') },
          { name: 'router', message: padQuestion('router') },
          { name: 'wizard', message: padQuestion('wizard') },
          { name: 'other', message: padQuestion('other') }
        ],
        validate: (value: any) =>
          value.length > 0
            ? true
            : chalk.red('✖ You must select at least one role.')
      },
      {
        type: 'input',
        name: 'customRole',
        message: padQuestion('Enter custom role (if any):'),
        skip: (state: any) => !(state.roles || []).includes('other'),
        result: (input: string) => input.trim()
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
        name: 'avatar',
        message: padQuestion('Provide an avatar URL or description (optional):'),
        initial: ''
      },
      {
        type: 'input',
        name: 'mainTask',
        message: padQuestion('What is the main task of this agent?'),
        initial: 'Summarize input as 3 bullet points'
      },
      {
        type: 'confirm',
        name: 'requiresConventions',
        message: padQuestion('Does this agent require behavioral conventions?'),
        initial: false
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
            : chalk.red('✖ Please select an ecosystem option.')
      }
    ]);

    const customRole = answers.customRole;
    if (customRole) {
      answers.roles = answers.roles.filter((r: string) => r !== 'other');
      answers.roles.push(customRole);
    }

    // Sanitize all string fields: trim and collapse whitespace
    Object.entries(answers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        (answers as any)[key] = value.trim().replace(/\s+/g, ' ');
      }
    });

    answers.processableTypes = answers.processableTypes.split(',').map((s: string) => s.trim()).filter(Boolean);

    const timestamp = getTimestamp();
    const typedAnswers: InitAnswers = {
      agentName: answers.agentName,
      description: answers.description,
      roles: answers.roles,
      processableTypes: answers.processableTypes,
      mainTask: answers.mainTask,
      requiresConventions: answers.requiresConventions,
      ecosystem: answers.ecosystem,
      avatar: answers.avatar || '',
      birth: timestamp,
    };

    const agentId = `${typedAnswers.agentName}@${timestamp}`;
    const agentFolder = path.resolve('.dokugent/data/agents', agentId);
    const identityPath = path.join(agentFolder, 'identity.json');

    // Update 'latest' symlink to point to the most recent agent folder
    const latestSymlinkPath = path.resolve('.dokugent/data/agents', 'latest');
    try {
      if (fs.existsSync(latestSymlinkPath)) fs.unlinkSync(latestSymlinkPath);
      fs.symlinkSync(agentFolder, latestSymlinkPath, 'dir');
    } catch (err) {
      paddedLog('Failed to create latest symlink', `${(err as Error).message || err}`, PAD_WIDTH, 'warn', 'FAILED');
    }

    fs.ensureDirSync(agentFolder);
    //complete files and folder structure on this timestamp
    // paddedLog('File', formatRelativePath(identityPath), PAD_WIDTH, 'success', 'SAVED');
    await confirmAndWriteFile(identityPath, JSON.stringify(typedAnswers, null, 2));

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

    const summaryText = [
      typedAnswers.agentName,
      typedAnswers.description,
      typedAnswers.roles.join(', '),
      typedAnswers.processableTypes.join(', '),
      typedAnswers.mainTask
    ].join(' ');

    const tokenCount = estimateTokensFromText(summaryText);
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
      paddedLog('Bye...', 'Agent wizard was cancelled.', PAD_WIDTH, 'warn');
      console.log()
      process.exit(0);
    }

    paddedLog('Agent wizard error', `${error.message || error}`, PAD_WIDTH, 'error', 'FAILED');
    console.log()
    process.exit(1);
  }
}
