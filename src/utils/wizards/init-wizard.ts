/**
 * Interactive wizard for configuring agent intent, behavior, and context.
 * Collects metadata and writes agent-spec.md and agent-spec.json files.
 */

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

export interface InitAnswers {
  agentName: string;
  description: string;
  roles: string[];
  protocols: string[];
  outputs: string[];
  understands: string[];
  allowExternalFiles: boolean;
  enforceApproval: boolean;
  denyList: string[];
}

export async function promptInitWizard(): Promise<InitAnswers> {
  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: 'input',
      name: 'agentName',
      message: 'What is the name of this agent?',
      validate: (input) => input.length > 0 || 'Agent name is required.'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Briefly describe what this agent should do.'
    },
    {
      type: 'checkbox',
      name: 'roles',
      message: 'What roles will this agent play?',
      choices: ['transformer', 'validator', 'researcher', 'editor', 'planner']
    },
    {
      type: 'checkbox',
      name: 'protocols',
      message: 'Which protocols does this agent follow?',
      choices: ['design-intent', 'form-export', 'cms-syntax', 'api-calls', 'data-validation']
    },
    {
      type: 'checkbox',
      name: 'outputs',
      message: 'What output formats should this agent produce?',
      choices: ['JSON', 'HTML', 'markdown', 'compressed-preview']
    },
    {
      type: 'input',
      name: 'understands',
      message: 'What should this agent understand? (comma-separated tags)',
      filter: (input) => input.split(',').map((s) => s.trim()).filter(Boolean)
    },
    {
      type: 'confirm',
      name: 'allowExternalFiles',
      message: 'Should this agent be allowed to read/write external files?',
      default: false
    },
    {
      type: 'confirm',
      name: 'enforceApproval',
      message: 'Should outputs require human approval before use?',
      default: true
    },
    {
      type: 'checkbox',
      name: 'denyList',
      message: 'Select default denylist files to apply:',
      choices: ['blacklist-health.txt', 'blacklist-finance.txt', 'blacklist-legal.txt'],
      default: ['blacklist-health.txt']
    }
  ]);

  const baseDir = path.resolve('agent-info/agents/agent-spec/init', answers.agentName);
  const agentToolsDir = path.resolve('agent-info/agent-tools');
  await fs.ensureDir(baseDir);
  await fs.ensureDir(agentToolsDir);

  // Write agent-spec.md
  const specMd = `# Agent Spec: ${answers.agentName}

## Description
${answers.description}

## Roles
${answers.roles.map((r) => `- ${r}`).join('\n')}

## Protocols
${answers.protocols.map((p) => `- ${p}`).join('\n')}

## Outputs
${answers.outputs.map((o) => `- ${o}`).join('\n')}

## Understands
${answers.understands.map((u) => `- ${u}`).join('\n')}

## Security
- allowExternalFiles: ${answers.allowExternalFiles}
- enforceApproval: ${answers.enforceApproval}
- denyList:
${answers.denyList.map((d) => `  - ${d}`).join('\n')}
`;

  await fs.outputFile(path.join(baseDir, 'agent-spec.md'), specMd);
  await fs.outputJson(path.join(baseDir, 'agent-spec.json'), answers, { spaces: 2 });

  // Write tool-list.md from understandings (placeholder logic)
  const toolList = `# Agent Tools\n\n${answers.understands.map((t) => `- ${t}`).join('\n')}`;
  await fs.outputFile(path.join(agentToolsDir, 'tool-list.md'), toolList);

  console.log(`✅ Agent spec written to ${baseDir}`);
  return answers;
}
