import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { expectedInitFiles } from '../config/fileStructure.js';
import { writeWithBackup } from '../utils/fileWriter.js';

export async function runWizard() {
  const dokugentDir = path.resolve('.dokugent');
  const toolsDir = path.join(dokugentDir, 'agent-tools');
  const baseFolders = ['conventions', 'plan', 'criteria'];

  // If .dokugent doesn't exist, scaffold structure
  if (!(await fs.pathExists(dokugentDir))) {
    await fs.ensureDir(dokugentDir);
    for (const folder of baseFolders) {
      const fullPath = path.join(dokugentDir, folder);
      await fs.ensureDir(fullPath);
      await fs.outputFile(path.join(fullPath, '.gitkeep'), '');
    }

    const initTemplatePath = path.resolve('presets/templates/init');
    for (const file of expectedInitFiles) {
      const source = path.join(initTemplatePath, file);
      const target = path.join(dokugentDir, file);
      const contents = await fs.readFile(source, 'utf-8');
      await writeWithBackup(target, contents);
    }

    await fs.ensureDir(toolsDir);
    await fs.outputFile(path.join(toolsDir, '.gitkeep'), '');
    console.log('📁 .dokugent folder and base files created.');
  }

  // Prompt user
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'agentType',
      message: 'What kind of project is this for?',
      choices: ['dev', 'writing', 'research']
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'What is the name of the project?'
    },
    {
      type: 'list',
      name: 'llm',
      message: 'Which LLM will this agent run on?',
      choices: ['codex', 'gpt', 'claude', 'gemini']
    },
    {
      type: 'checkbox',
      name: 'interactionMode',
      message: 'How will this agent be used?',
      choices: ['CLI tool', 'Chat agent', 'Web service', 'Embedded tool']
    },
    {
      type: 'checkbox',
      name: 'tools',
      message: 'What tools or capabilities will your agent require?',
      choices: [
        'File system access',
        'API calls',
        'Browser DOM access',
        'Local CLI tools',
        'Database or vector search',
        'Human-in-the-loop review',
        'Long-term memory / context window',
        'Multi-agent coordination'
      ]
    },
    {
      type: 'input',
      name: 'tasks',
      message: 'What should this agent do? (List tasks or goals — leave blank if unsure)'
    }
  ]);

  // Write PROJECTS.md
  const projectContent = `
# Project: ${answers.projectName}

## Agent Type
${answers.agentType}

## Target LLM
${answers.llm}

## Interaction Mode
${answers.interactionMode.map(m => `- ${m}`).join('\n')}

## Tools / Capabilities
${answers.tools.map(t => `- ${t}`).join('\n')}

## Key Tasks
${answers.tasks
      ? answers.tasks.split(',').map(t => `- ${t.trim()}`).join('\n')
      : '_User has not defined any tasks yet._'}
`;

  // Backup PROJECTS.md if it exists before writing new content
  const projectPath = path.join(dokugentDir, 'PROJECTS.md');
  const projectBakDir = path.join(dokugentDir, '.bak');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(projectBakDir, `PROJECTS.md-${timestamp}`);

  if (await fs.pathExists(projectPath)) {
    await fs.ensureDir(projectBakDir);
    await fs.copy(projectPath, backupPath);
  }
  await fs.outputFile(projectPath, projectContent);
  console.log(`📝 PROJECTS.md updated at ${dokugentDir}/PROJECTS.md`);

  // Write tool-list.md
  const toolsContent = `# Agent Tools\n\n${answers.tools.map(t => `- ${t}`).join('\n')}`;
  await fs.outputFile(path.join(toolsDir, 'tool-list.md'), toolsContent);
  console.log(`🧩 tool-list.md created at ${toolsDir}/tool-list.md`);
}