/**
 * @file plan-wizard.ts
 * @description Interactive CLI wizard for defining agent plan steps and capabilities.
 * Outputs a versioned `plan.md` file and updates the active symlink.
 */
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { writeWithBackup } from '../file-writer';
import { estimateTokensFromText } from '../tokenizer';

/**
 * Launches the interactive wizard for creating an agent plan.
 *
 * Responsibilities:
 * - Prompts for step ID, agent metadata, goal, and constraints.
 * - Generates a versioned `plan.md` file describing the plan structure.
 * - Defines tool usage and links capabilities to step identifiers.
 * - Updates the symlink to the latest plan version.
 *
 * @returns {Promise<void>}
 */
export async function promptPlanWizard(): Promise<void> {
  const agentSymlink = path.resolve('.dokugent/data/agents/current');
  let agentId = 'unknown-agent';
  try {
    agentId = await fs.readlink(agentSymlink);
  } catch {
    console.error('❌ No active agent found. Run `dokugent agent use <name>` first.');
    return;
  }
  const baseFolder = path.resolve('.dokugent/data/plans', agentId);
  const mdPath = path.join(baseFolder, 'plan.md');
  await fs.ensureDir(baseFolder);

  const stepFolder = path.join('.dokugent/data/plans', agentId, 'steps');
  await fs.ensureDir(stepFolder);
  const existingSteps = (await fs.readdir(stepFolder)).map(f => f.replace('.md', ''));

  const availableChoices = ['summarize_input', 'web_search', 'data_extraction', 'custom'].filter(
    step => !existingSteps.includes(step)
  );

  const { stepId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stepId',
      message: 'Select a plan step ID:',
      choices: availableChoices,
    },
  ]);

  let finalStepId = stepId;
  if (stepId === 'custom') {
    const { customStepId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customStepId',
        message: 'Enter custom step ID:',
        default: 'my_step',
      },
    ]);
    if (existingSteps.includes(customStepId)) {
      console.warn(`⚠️ Step ID "${customStepId}" already exists. This will overwrite the current step.`);
    }
    finalStepId = customStepId;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Plan overview (what is this step about?)',
      default: `High-level description for ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'role',
      message: 'Agent Role (What is this agent responsible for?):',
      default: `Agent for step ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'goal',
      message: 'Goal of this step:',
      default: `Fulfill step ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'constraints',
      message: 'List constraints (comma-separated):',
      default: 'Must use defined tools only, Output must pass human review',
      filter: (input: string) => input.split(',').map((s: string) => s.trim()),
    },
  ]);


  const steps = [
    { id: finalStepId, use: 'summarize-tool', input: 'input.md', output: 'draft-summary.md' },
    { id: 'review_summary', use: 'review-tool', input: 'draft-summary.md', output: 'output.md', required_approvals: ['human-review'] }
  ];
  const toolSet = [...new Set(steps.map(step => step.use))];

  const planMdContent = `# PLAN.md

## Plan Step ID
${finalStepId}

## Plan Description
${answers.description}

## Agent Name
${agentId}

## Agent Role
${answers.role}

## Goal
${answers.goal}

## Capabilities
${steps.map((step, i) => `${i + 1}. ${step.id} → ${step.use} (${step.input} → ${step.output})`).join('\n')}

## Constraints
${answers.constraints.map((c: string) => `- ${c}`).join('\n')}

## Tools It Can Use
${toolSet.map(tool => `- ${tool}`).join('\n')}
`;

  const stepFileName = `${finalStepId}.md`;
  const stepFilePath = path.join(stepFolder, stepFileName);
  if (await fs.pathExists(stepFilePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(stepFolder, `${finalStepId}-${timestamp}.bak.md`);
    await fs.copyFile(stepFilePath, backupPath);
  }
  await fs.outputFile(stepFilePath, planMdContent);

  const allStepFiles = await fs.readdir(stepFolder);
  const combined = (
    await Promise.all(
      allStepFiles
        .filter(f => f.endsWith('.md') && !f.endsWith('.bak.md'))
        .sort()
        .map(f => fs.readFile(path.join(stepFolder, f), 'utf8'))
    )
  ).join('\n\n---\n\n');

  // Simplified behavior: write combined plan directly to plan.md with backup
  if (await fs.pathExists(mdPath)) {
    const backupPath = path.join(baseFolder, `plan.bak.md`);
    await fs.copyFile(mdPath, backupPath);
  }
  await fs.outputFile(mdPath, `# PLAN.md\n\n${combined}`);

  const tokenCount = estimateTokensFromText(combined);
  console.log(`\n✅ plan.md created at:\n   .dokugent/data/plans/${agentId}/\n`);
  console.log(`🧮 Estimated agent plan step tokens: \x1b[32m~${tokenCount} tokens\x1b[0m\n`);

  // Update latest symlink
  const symlinkPath = path.resolve('.dokugent/data/plans', 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(baseFolder, symlinkPath, 'dir');
}
