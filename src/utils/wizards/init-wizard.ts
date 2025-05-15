/**
  * Interactive wizard for configuring agent intent, behavior, and context.
 * Collects metadata and writes agent - spec.md and agent - spec.json files.
 */

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { confirmAndWriteFile } from '../../utils/fs-utils';

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
  customProtocols?: string[];
  customOutputs?: string[];
}

export async function promptInitWizard(useDefaultsOnly = false): Promise<InitAnswers> {
  if (useDefaultsOnly) {
    const defaults: InitAnswers = {
      agentName: 'default-agent',
      description: 'An AI agent scaffolded with default settings.',
      roles: ['researcher'],
      protocols: ['design-intent'],
      outputs: ['JSON'],
      understands: ['yaml'],
      allowExternalFiles: false,
      enforceApproval: true,
      denyList: ['blacklist-health.txt']
    };

    const baseDir = path.resolve('.dokugent/agents/init', defaults.agentName);
    await fs.ensureDir(baseDir);

    const specMd = `# Agent Spec: ${defaults.agentName}

## Description
${defaults.description}

## Roles
${defaults.roles.map((r: string) => `- ${r}`).join('\n')}

## Protocols
${defaults.protocols.map((p: string) => `- ${p}`).join('\n')}

## Outputs
${defaults.outputs.map((o: string) => `- ${o}`).join('\n')}

## Understands
${defaults.understands.map((u: string) => `- ${u}`).join('\n')}

## Security
- allowExternalFiles: ${defaults.allowExternalFiles}
- enforceApproval: ${defaults.enforceApproval}
- denyList:
${defaults.denyList.map((d: string) => `  - ${d}`).join('\n')}
`;

    await confirmAndWriteFile(path.join(baseDir, 'agent-spec.md'), specMd);
    await confirmAndWriteFile(path.join(baseDir, 'agent-spec.json'), JSON.stringify(defaults, null, 2));
    const toolList = `# Agent Tools\n\n${defaults.understands.map((t: string) => `- ${t}`).join('\n')}`;
    await confirmAndWriteFile(path.join(baseDir, 'tool-list.md'), toolList);
    const blacklistDir = path.resolve('.dokugent/overrides/blacklist');
    await fs.ensureDir(blacklistDir);
    for (const filename of defaults.denyList) {
      const filepath = path.join(blacklistDir, filename);
      await confirmAndWriteFile(filepath, '');
    }

    console.log(`✅ Agent spec written to ${baseDir}`);
    return defaults;
  }
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'What is the name of this agent? (e.g., research-buddy, validator-ai)',
      default: 'my-agent',
      validate: (input: string) => input.trim().length > 0 || 'Agent name cannot be blank.'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Briefly describe what this agent should do. (e.g., Summarize documents and validate sources)',
      default: 'Assist with general research and summarization.'
    },
    {
      type: 'input',
      name: 'roles',
      message: 'What roles will this agent play? (comma-separated, e.g., researcher,planner)',
      default: 'researcher,validator',
      filter: (input: string) =>
        input.split(',').map((r: string) => r.trim()).filter((r: string) => Boolean(r))
    },
    {
      type: 'checkbox',
      name: 'protocols',
      message: 'Which protocols does this agent follow? (Select based on your system architecture)',
      choices: ['design-intent', 'form-export', 'cms-syntax', 'api-calls', 'data-validation', 'custom'],
      default: ['design-intent']
    },
    {
      type: 'input',
      name: 'customProtocols',
      message: 'Enter any custom protocols (comma-separated), or leave blank:',
      when: (answers: any) => answers.protocols?.includes('custom') ?? false,
      filter: (input: string) =>
        input.split(',').map((s: string) => s.trim()).filter((s: string) => Boolean(s))
    },
    {
      type: 'checkbox',
      name: 'outputs',
      message: 'What output formats should this agent produce? (Pick at least one)',
      choices: ['JSON', 'HTML', 'markdown', 'compressed-preview', 'custom'],
      default: ['JSON', 'markdown']
    },
    {
      type: 'input',
      name: 'customOutputs',
      message: 'Enter any custom outputs (comma-separated), or leave blank:',
      when: (answers: any) => answers.outputs?.includes('custom') ?? false,
      filter: (input: string) =>
        input.split(',').map((s: string) => s.trim()).filter((s: string) => Boolean(s))
    },
    {
      type: 'input',
      name: 'understands',
      message: 'What should this agent understand? (e.g., yaml, figma, seo — comma-separated)',
      default: 'yaml,markdown',
      filter: (input: string) => input
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => Boolean(s))
    },
    {
      type: 'confirm',
      name: 'allowExternalFiles',
      message: 'Should this agent be allowed to read/write external files? (May impact security)',
      default: false
    },
    {
      type: 'confirm',
      name: 'enforceApproval',
      message: 'Should outputs require human approval before use? (Recommended: Yes)',
      default: true
    },
    {
      type: 'checkbox',
      name: 'denyList',
      message: 'Select default denylist files to apply: (Prevents unsafe requests)',
      choices: ['blacklist-health.txt', 'blacklist-finance.txt', 'blacklist-legal.txt'],
      default: ['blacklist-health.txt']
    }
  ]);

  const typedAnswers = answers as InitAnswers & {
    customProtocols?: string[];
    customOutputs?: string[];
  };

  const protocols = [
    ...typedAnswers.protocols.filter((p: string) => p !== 'custom'),
    ...(typedAnswers.customProtocols || [])
  ];
  typedAnswers.protocols = protocols;

  // Merge predefined and custom outputs
  const outputs = [
    ...typedAnswers.outputs.filter((o: string) => o !== 'custom'),
    ...(typedAnswers.customOutputs || [])
  ];
  typedAnswers.outputs = outputs;


  const baseDir = path.resolve('.dokugent/agent-info/agents/agent-spec/init', typedAnswers.agentName);
  await fs.ensureDir(baseDir);

  // Write agent-spec.md
  const specMd = `# Agent Spec: ${typedAnswers.agentName}

## Description
${typedAnswers.description}

## Roles
${typedAnswers.roles.map((r: string) => `- ${r}`).join('\n')}

## Protocols
${typedAnswers.protocols.map((p: string) => `- ${p}`).join('\n')}

## Outputs
${typedAnswers.outputs.map((o: string) => `- ${o}`).join('\n')}

## Understands
${typedAnswers.understands.map((u: string) => `- ${u}`).join('\n')}

## Security
- allowExternalFiles: ${typedAnswers.allowExternalFiles}
- enforceApproval: ${typedAnswers.enforceApproval}
- denyList:
${typedAnswers.denyList.map((d: string) => `  - ${d}`).join('\n')}
`;

  await confirmAndWriteFile(path.join(baseDir, 'agent-spec.md'), specMd);
  await confirmAndWriteFile(path.join(baseDir, 'agent-spec.json'), JSON.stringify(typedAnswers, null, 2));

  // Write tool-list.md from understandings (placeholder logic)
  const toolList = `# Agent Tools\n\n${typedAnswers.understands.map((t: string) => `- ${t}`).join('\n')}`;
  await confirmAndWriteFile(path.join(baseDir, 'tool-list.md'), toolList);
  // Write selected denylist filenames to .dokugent/overrides/blacklist
  const blacklistDir = path.resolve('.dokugent/overrides/blacklist');
  await fs.ensureDir(blacklistDir);
  for (const filename of typedAnswers.denyList) {
    const filepath = path.join(blacklistDir, filename);
    await confirmAndWriteFile(filepath, '');
  }

  console.log(`✅ Agent spec written to ${baseDir}`);
  return typedAnswers;
}
