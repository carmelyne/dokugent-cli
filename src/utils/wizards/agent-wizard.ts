/**
 * @file init-wizard.ts
 * @description Interactive CLI wizard for initializing a new Dokugent agent.
 * Generates agent-spec.md and agent-spec.json files, along with tool lists and denylist files.
 */

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { confirmAndWriteFile } from '../fs-utils';
import { getTimestamp } from '../timestamp';
import { estimateTokensFromText } from '../tokenizer';

export interface InitAnswers {
  agentName: string;
  description: string;
  roles: string[];
  processableTypes: string[];
  owner: string;
  ownerId: string;
  mainTask: string;
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
  if (useDefaultsOnly) {
    const defaults: InitAnswers = {
      agentName: 'default-agent',
      description: 'An AI agent scaffolded with default settings.',
      roles: ['summarizer'],
      processableTypes: ['english', 'markdown structure'],
      owner: 'Kinderbytes',
      ownerId: 'kinderbytes.org',
      mainTask: 'Summarize input as 3 bullet points'
    };

    return defaults;
  }
  const answers = await (inquirer as any).prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'What is the name of this agent?',
      default: 'summarybot',
      validate: (input: string) => input.trim().length > 0 || 'Agent name cannot be blank.'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Briefly describe what this agent should do:',
      default: 'Assists with summarizing input text'
    },
    {
      type: 'checkbox',
      name: 'roles',
      message: 'What roles will this agent perform?',
      choices: ['summarizer', 'formatter', new inquirer.Separator(), 'other'],
      default: ['summarizer'],
      validate: (input: string[]) =>
        input.length > 0 || 'You must select at least one role.'
    },
    {
      type: 'input',
      name: 'customRole',
      message: 'Enter custom role (if any):',
      when: (answers: any) => answers.roles.includes('other'),
      filter: (input: string) => input.trim()
    },
    {
      type: 'input',
      name: 'processableTypes',
      message: 'Content Types Accepted (comma-separated):',
      default: 'english, markdown structure',
      filter: (input: string) =>
        input.split(',').map((s: string) => s.trim()).filter(Boolean)
    },
    {
      type: 'input',
      name: 'owner',
      message: 'Who owns this agent? (e.g., Kinderbytes)',
      default: 'Kinderbytes'
    },
    {
      type: 'input',
      name: 'ownerId',
      message: 'Owner ID or domain (e.g., kinderbytes.org)',
      default: 'kinderbytes.org'
    },
    {
      type: 'input',
      name: 'mainTask',
      message: 'What is the main task of this agent?',
      default: 'Summarize input as 3 bullet points'
    }
  ]);

  // console.log(`✔ Selected roles: ${answers.roles.join(', ')}`);

  // Sanitize all string fields: trim and collapse whitespace
  Object.entries(answers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      (answers as any)[key] = value.trim().replace(/\s+/g, ' ');
    }
  });

  const customRole = (answers as any).customRole;
  if (customRole) {
    answers.roles = answers.roles.filter((r: string) => r !== 'other');
    answers.roles.push(customRole);
  }

  const typedAnswers: InitAnswers = {
    agentName: answers.agentName,
    description: answers.description,
    roles: answers.roles,
    processableTypes: answers.processableTypes,
    owner: answers.owner,
    ownerId: answers.ownerId,
    mainTask: answers.mainTask
  };

  const summaryText = [
    typedAnswers.agentName,
    typedAnswers.description,
    typedAnswers.roles.join(', '),
    typedAnswers.processableTypes.join(', '),
    typedAnswers.mainTask
  ].join(' ');

  const tokenCount = estimateTokensFromText(summaryText);
  console.log(`\n🧮 Estimated agent profile tokens: \x1b[32m~${tokenCount} tokens\x1b[0m`);

  return typedAnswers;
}
