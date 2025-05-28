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
    {
      id: finalStepId,
      use: 'summarize-tool',
      input: 'input.md',
      output: 'draft-summary.md'
    }
  ];
  const toolSet = Array.from(new Set(steps.map(step => step.use)));

  // Update plan.index.md to reflect linkage
  const indexPath = path.join(baseFolder, 'plan.index.md');
  let indexLines: string[] = [];

  if (await fs.pathExists(indexPath)) {
    indexLines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
  }

  const alreadyListed = indexLines.some(line => line.trim().startsWith(`${finalStepId} -`));
  if (!alreadyListed) {
    indexLines.push(`${finalStepId} - linked`);
    await fs.writeFile(indexPath, indexLines.join('\n'), 'utf-8');
  }

  // Write plan.json as a twin of plan.md, with backup if exists, and merge with existing if present
  const jsonPath = path.join(baseFolder, 'plan.json');
  const jsonData = {
    agentId,
    steps: steps.map(step => ({
      id: step.id,
      use: step.use,
      input: step.input,
      output: step.output,
      description: answers.description,
      role: answers.role,
      goal: answers.goal,
      constraints: answers.constraints
    }))
  };

  if (await fs.pathExists(jsonPath)) {
    const backupPath = path.join(baseFolder, 'plan.bak.json');
    await fs.copyFile(jsonPath, backupPath);

    const existingJson = await fs.readJson(jsonPath);
    const existingSteps = existingJson.steps || [];

    // Merge with deduplication
    const mergedSteps = [...existingSteps, ...jsonData.steps].filter(
      (step, index, self) =>
        index === self.findIndex(s => s.id === step.id)
    );

    jsonData.steps = mergedSteps;
  }
  await fs.outputJson(jsonPath, jsonData, { spaces: 2 });

  const tokenCount = estimateTokensFromText(JSON.stringify(jsonData, null, 2));
  console.log(`\n✅ plan.json updated inside:\n   .dokugent/data/plans/${agentId}/\n`);
  console.log(`🧮 Estimated agent plan step tokens: \x1b[32m~${tokenCount} tokens\x1b[0m\n`);

  // Update latest symlink
  const symlinkPath = path.resolve('.dokugent/data/plans', 'latest');
  try {
    await fs.remove(symlinkPath);
  } catch { }
  await fs.symlink(baseFolder, symlinkPath, 'dir');
}
