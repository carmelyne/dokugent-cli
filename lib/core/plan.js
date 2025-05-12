/**
 * Creates or updates a Dokugent agent plan.
 * Generates both a human-readable plan.md and machine-readable plan.yaml.
 * Used to define the agent’s role, reasoning steps, and supported tools.
 * Supports --force to overwrite existing files with backups.
 */

import fs from 'fs-extra';
import path from 'path';
import { writeWithBackup } from '../utils/fileWriter.js';
import inquirer from 'inquirer';

export async function runPlan({ subcommand, target, force = false } = {}) {
  const planDir = path.resolve('.dokugent/plan');
  await fs.ensureDir(planDir);

  // Always read entries once for reuse
  const entries = await fs.readdir(planDir);
  if (subcommand === 'ls') {
    const grouped = {};
    for (const entry of entries) {
      if (entry === '.gitkeep') continue;
      const fullPath = path.join(planDir, entry);
      const stat = await fs.lstat(fullPath);
      const [base] = entry.split('-202');
      if (!grouped[base]) grouped[base] = [];
      grouped[base].push({ entry, isSymlink: stat.isSymbolicLink() });
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.entry.localeCompare(b.entry));
    }
    for (const key of Object.keys(grouped)) {
      console.log(`${key}:`);
      for (const { entry, isSymlink } of grouped[key]) {
        const tag = isSymlink ? '✅' : '';
        console.log(`  - ${entry} ${tag}`);
      }
    }

    // Show aliases (collect all valid symlinks not grouped under a known key)
    const knownKeys = Object.keys(grouped);
    const aliasEntries = [];

    for (const entry of fs.readdirSync(planDir)) {
      if (entry === '.gitkeep') continue;
      const fullPath = path.join(planDir, entry);
      let stat;
      try {
        stat = fs.lstatSync(fullPath);
      } catch {
        continue;
      }
      if (!stat.isSymbolicLink()) continue;

      const isGrouped = knownKeys.some(key => entry === key || entry.startsWith(`${key}-`));
      if (!isGrouped) {
        try {
          const realPath = fs.readlinkSync(fullPath);
          aliasEntries.push({ alias: entry, target: path.basename(realPath) });
        } catch {
          continue;
        }
      }
    }

    if (aliasEntries.length > 0) {
      console.log('\nAliases:');
      for (const { alias, target } of aliasEntries) {
        console.log(`  ${alias} → ${target} ✅`);
      }
    }
    return;
  }

  if (subcommand === 'current') {
    for (const entry of entries) {
      const fullPath = path.join(planDir, entry);
      if ((await fs.lstat(fullPath)).isSymbolicLink()) {
        const realPath = await fs.readlink(fullPath);
        console.log(`${entry} → ${path.basename(realPath)}`);
      }
    }
    return;
  }

  if (subcommand === 'use' && target) {
    let stepId, version;

    if (target.includes('@')) {
      [stepId, version] = target.split('@');
    } else if (target.includes(' ')) {
      const parts = target.split(' ').filter(Boolean);
      if (parts.length === 3 && parts[1] === '@') {
        stepId = parts[0];
        version = parts[2];
      }
    } else if (target.includes('-202')) {
      const i = target.lastIndexOf('-202');
      stepId = target.slice(0, i);
      version = target.slice(i + 1);
    }

    if (!stepId || !version) {
      console.error(`❌ Invalid format. Use: dokugent plan use <stepId>@<timestamp> or dokugent plan use <full-folder-name>`);
      return;
    }

    const candidates = await fs.readdir(planDir);
    const match = candidates.find(f => f.startsWith(`${stepId}-${version}`));
    if (!match) {
      console.error(`❌ No matching plan found for ${stepId}@${version}`);
      return;
    }

    const symlinkPath = path.join(planDir, stepId);
    try { await fs.remove(symlinkPath); } catch { }
    await fs.symlink(path.join(planDir, match), symlinkPath, 'dir');
    console.log(`🔗 Symlink updated: ${stepId} → ${match}`);
    return;
  }

  if (subcommand === 'unlink' && target) {
    const aliasPath = path.join(planDir, target);
    if (!(await fs.pathExists(aliasPath))) {
      console.error(`❌ No symlink or folder named '${target}' found.`);
      return;
    }
    const stat = await fs.lstat(aliasPath);
    if (!stat.isSymbolicLink()) {
      console.error(`❌ '${target}' exists but is not a symlink.`);
      return;
    }
    await fs.remove(aliasPath);
    console.log(`🗑️ Symlink removed: ${target}`);
    return;
  }

  if (subcommand === 'alias' && target) {
    const [alias, versionRef] = target.split('@');
    if (!alias || !versionRef) {
      console.error('❌ Usage: dokugent plan alias <alias>@<version>');
      return;
    }
    const candidates = await fs.readdir(planDir);
    const match = candidates.find(f => f.startsWith(`${alias}-${versionRef}`));
    if (!match) {
      console.error(`❌ No matching version found for ${alias}@${versionRef}`);
      return;
    }
    const aliasPath = path.join(planDir, alias);
    const targetPath = path.resolve(planDir, match);
    try {
      if (fs.existsSync(aliasPath)) {
        console.warn(`⚠️ Overwriting existing alias: '${alias}'`);
        console.warn(`💡 Consider namespacing your alias, e.g., '${match.split('-')[0]}-${alias}'`);
        fs.unlinkSync(aliasPath);
      }
    } catch { }
    // FIXME: Alias symlink creation appears to silently fail on some systems (e.g., macOS Finder & VSCode).
    // The alias is reported as set but the symlink does not show in .dokugent/plan.
    // Confirmed that certify.js works, so revisit this flow with stripped-down test.
    // 🔍 Suspect: fs.symlinkSync path context, async/sync boundaries, or silent permissions error.
    fs.symlinkSync(targetPath, aliasPath, 'dir');
    if (fs.existsSync(aliasPath) && fs.lstatSync(aliasPath).isSymbolicLink()) {
      console.log(`📎 Verified: ${alias} → ${fs.readlinkSync(aliasPath)}`);
    } else {
      console.error(`❌ Symlink for alias '${alias}' not found after creation.`);
    }
    console.log(`✅ Alias '${alias}' set to folder '${match}'`);
    return;
  }

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
      message: 'Describe the plan:',
      default: `Plan for step ${finalStepId}`,
    },
    {
      type: 'input',
      name: 'agent',
      message: 'Agent name:',
      default: 'llm-core',
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
      filter: (input) => input.split(',').map((s) => s.trim()),
    },
  ]);

  const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
  let baseFolder = path.join(planDir, `${finalStepId}-${timestamp}`);
  let suffix = 1;
  while (await fs.pathExists(baseFolder)) {
    baseFolder = path.join(planDir, `${finalStepId}-${timestamp}-${suffix++}`);
  }
  await fs.ensureDir(baseFolder);

  const mdPath = path.join(baseFolder, 'plan.md');
  const yamlPath = path.join(baseFolder, 'plan.yaml');

  if (!force && (await fs.pathExists(mdPath) || await fs.pathExists(yamlPath))) {
    console.log('⚠️ plan.md or plan.yaml already exists. Use --force to overwrite.');
    return;
  }

  // Define the steps array explicitly
  const steps = [
    { id: finalStepId, use: 'summarize-tool', input: 'input.md', output: 'draft-summary.md' },
    { id: 'review_summary', use: 'review-tool', input: 'draft-summary.md', output: 'output.md', required_approvals: ['human-review'] }
  ];
  // Derive the toolSet dynamically
  const toolSet = [...new Set(steps.map(step => step.use))];

  const planMdContent = `# PLAN.md

## Agent Role
${answers.description}

## Goal
${answers.goal}

## Capabilities
${steps.map((step, i) => `${i + 1}. ${step.id} → ${step.use} (${step.input} → ${step.output})`).join('\n')}

## Constraints
${answers.constraints.map((c) => `- ${c}`).join('\n')}

## Tools It Can Use
${toolSet.map(tool => `- ${tool}`).join('\n')}
`;

  const planYamlContent = `description: "${answers.description}"
agent: ${answers.agent}
goal: "${answers.goal}"
tools:
${toolSet.map(tool => `  - ${tool}`).join('\n')}
constraints:
${answers.constraints.map((c) => `  - "${c}"`).join('\n')}
steps:
${steps.map(step => {
    let s = `  - id: ${step.id}
    use: ${step.use}
    input: ${step.input}
    output: ${step.output}`;
    if (step.required_approvals) {
      s += `\n    required_approvals: ${JSON.stringify(step.required_approvals)}`;
    }
    return s;
  }).join('\n')}
`;

  await writeWithBackup(mdPath, planMdContent);
  await writeWithBackup(yamlPath, planYamlContent);

  console.log(`✅ plan.md and plan.yaml created in ${baseFolder}/`);

  const symlinkPath = path.join(planDir, finalStepId);
  try {
    await fs.remove(symlinkPath); // Remove existing symlink or folder
  } catch (e) {
    // No-op if it doesn't exist
  }
  await fs.symlink(baseFolder, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: ${finalStepId} → ${path.basename(baseFolder)}`);
}