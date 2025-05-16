/**
 * @file plan-wizard.ts
 * @description Interactive CLI wizard for defining agent plan steps and capabilities.
 * Outputs a versioned `plan.md` file and updates the active symlink.
 */
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { writeWithBackup } from '../file-writer';

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
  const planDir = path.resolve('.dokugent/plan');
  await fs.ensureDir(planDir);

  const { stepId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stepId',
      message: 'Select a plan step ID:',
      choices: ['summarize_input', 'web_search', 'data_extraction', 'custom'],
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
      name: 'agent',
      message: 'Agent name:',
      default: 'llm-core',
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

  const timestamp = new Date().toISOString().replace(/[:]/g, '-');
  let baseFolder = path.join(planDir, `${finalStepId}-${timestamp}`);
  let suffix = 1;
  while (await fs.pathExists(baseFolder)) {
    baseFolder = path.join(planDir, `${finalStepId}-${timestamp}-${suffix++}`);
  }
  await fs.ensureDir(baseFolder);

  const steps = [
    { id: finalStepId, use: 'summarize-tool', input: 'input.md', output: 'draft-summary.md' },
    { id: 'review_summary', use: 'review-tool', input: 'draft-summary.md', output: 'output.md', required_approvals: ['human-review'] }
  ];
  const toolSet = [...new Set(steps.map(step => step.use))];

  const mdPath = path.join(baseFolder, 'plan.md');
  const planMdContent = `# PLAN.md

## Plan Description
${answers.description}

## Agent Name
${answers.agent}

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

  await writeWithBackup(mdPath, planMdContent);

  console.log(`✅ plan.md created in ${baseFolder}/`);
  console.log(`ℹ️  Run 'dokugent plan sync' to regenerate plan.json`);

  const symlinkPath = path.join(planDir, finalStepId);
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(baseFolder, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: ${finalStepId} → ${path.basename(baseFolder)}`);
}