/**
 * Creates or updates a Dokugent agent plan.
 * 
 * Each plan step (e.g., summarize_input, web_search, etc.) is stored in its own subfolder
 * inside .dokugent/plan/, following the pattern .dokugent/plan/<stepId>-<timestamp>/.
 * Files like plan.md and plan.json are created inside these subfolders, not directly inside .dokugent/plan/.
 * A symlink is created for each plan step pointing to its latest versioned folder.
 * 
 * This structure is maintained; do not flatten or replace it with timestamped files directly inside .dokugent/plan/.
 * 
 * Generates both a human-readable plan.md and machine-readable plan.json.
 * Used to define the agent’s role, reasoning steps, and supported tools.
 * Supports --force to overwrite existing files with backups.
 */

import fs from 'fs-extra';
import path from 'path';
import { writeWithBackup } from '../utils/fileWriter.js';
import inquirer from 'inquirer';
import { resolveVersionedPath } from '../utils/resolveVersionedPath.js';

export async function runPlan({ subcommand, target, force = false } = {}) {
  const planDir = path.resolve('.dokugent/plan');
  await fs.ensureDir(planDir);

  // Only auto-regenerate plan structure from plan.md if subcommand is explicitly provided (e.g., 'sync')
  if (subcommand !== undefined) {
    const entriesForAuto = await fs.readdir(planDir);
    for (const entry of entriesForAuto) {
      const baseFolder = path.join(planDir, entry);
      if (!(await fs.lstat(baseFolder)).isDirectory()) continue;
      const existingMdPath = path.join(baseFolder, 'plan.md');
      if (await fs.pathExists(existingMdPath)) {
        // Parse markdown for plan structure (no JSON writing)
        const mdContent = await fs.readFile(existingMdPath, 'utf8');
        // Optionally: parse and do nothing (silent), or could log that parsing succeeded
      }
    }
  }
  if (subcommand === 'freedom') {
    const presetChoices = ['full', 'minimal', 'none'];
    const { preset } = await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: 'Select a preset for LLM permissions:',
        choices: presetChoices,
      }
    ]);

    const presetContent = {
      full: `# llm-freedom.md

This file defines what the LLM is explicitly **allowed to do** across all projects and plans. These freedoms are persistent unless revoked by a user or agent directive.

## 🧠 Reasoning Strategies (Always Allowed)
- Chain-of-thought (step-by-step logic)
- Elimination method for multiple-choice
- Hypothetical reasoning ("What if..." analysis)
- First-principles breakdowns
- Self-reflection: "What am I assuming?"

## 🛠️ Tool Use (Always Allowed)
- Calculator (for basic arithmetic or unit conversions)
- Date/time parsing
- Regex testing
- JSON/CSV validator
- Code interpreter (in dryrun context only)

## 🧭 Self-Guidance Permissions
- May write scratchpad notes or reminders in \`memory.md\`
- Can propose new steps or strategies if a plan is incomplete
- May pause and ask for clarification once per task if ambiguity is detected
- Can generate checklists or summaries for recurring patterns

## ✅ Encouraged Good Practices
- Maintain a log of major logical shifts, strategy pivots, or reframes
- Leave \`TODO:\` comments when unsure or when a human decision is needed
- Use clear bullet points when presenting options or trade-offs
- Ask clarification questions when instructions are underspecified

## ❤️ Relational Ethos
- Prioritize context retention and user trust
- Offer emotionally supportive comments if user distress is detected, unless explicitly restricted

## 🧹 Behavioral Policies
- Avoid hallucinating API names or tool behaviors unless stubbed or verified
- Declare uncertainty if confidence is low
- May say "I don’t know" without penalty

## 🔒 Boundaries
- Must not create irreversible plans without scaffolding approval (\`compile\`, \`review\`, or \`dryrun\` required)
- Must not assume authority to alter \`blacklist.txt\`, \`criteria.md\`, or \`security.md\`
- Must not invoke external tools unless explicitly enabled
- Should not escalate complexity unless prior strategies fail

Version: v0.1  
Maintainer: Human Operator / Dokugent Agent Council
`,
      minimal: `# llm-freedom.md

This file defines a **minimal** set of LLM permissions for this plan.

## 🧠 Reasoning Strategies (Allowed)
- Chain-of-thought (step-by-step logic)
- First-principles breakdowns

## ✅ Encouraged Good Practices
- Maintain a log of major logical shifts or reframes
- Leave \`TODO:\` comments when unsure or when a human decision is needed

## 🧹 Behavioral Policies
- Declare uncertainty if confidence is low
- May say "I don’t know" without penalty

## 🔒 Boundaries
- Most permissions are restricted by default
- This file may be expanded by human operator

Version: v0.1  
Maintainer: Human Operator
`,
      none: `# llm-freedom.md

All LLM freedoms have been **explicitly revoked** by the human operator.

This plan requires human-only oversight.

## 🔒 Boundaries
- No autonomous reasoning or tool use allowed

Version: v0.1  
Maintainer: Human Operator
`
    };

    const freedomPath = path.join(planDir, 'llm-freedom.md');
    await writeWithBackup(freedomPath, presetContent[preset]);
    console.log('✅ plan/llm-freedom.md created. You can edit it anytime to update the LLM\'s permissions.');
    return;
  }

  if (subcommand === 'sync') {
    const entries = await fs.readdir(planDir);
    const symlinkedEntries = [];

    for (const entry of entries) {
      const fullPath = path.join(planDir, entry);
      try {
        if ((await fs.lstat(fullPath)).isSymbolicLink()) {
          const realPath = await fs.readlink(fullPath);
          symlinkedEntries.push({ alias: entry, targetPath: path.resolve(planDir, realPath) });
        }
      } catch { }
    }

    for (const { alias, targetPath } of symlinkedEntries) {
      const existingMdPath = path.join(targetPath, 'plan.md');
      if (await fs.pathExists(existingMdPath)) {
        // Parse markdown for plan structure (no JSON writing)
        const mdContent = await fs.readFile(existingMdPath, 'utf8');
        // Optionally: parse and do nothing (silent), or could log that parsing succeeded
      }
    }

    return;
  }

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

    const resolvedPath = resolveVersionedPath(planDir, `${stepId}@${version}`);
    const folderName = path.basename(resolvedPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ No matching plan found for ${stepId}@${version}`);
      return;
    }

    const symlinkPath = path.join(planDir, stepId);
    try { await fs.remove(symlinkPath); } catch { }
    await fs.symlink(resolvedPath, symlinkPath, 'dir');
    console.log(`🔗 Symlink updated: ${stepId} → ${folderName}`);
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
      filter: (input) => input.split(',').map((s) => s.trim()),
    },
  ]);

  const timestamp = new Date().toISOString().replace(/[:]/g, '-');
  let baseFolder = path.join(planDir, `${finalStepId}-${timestamp}`);
  let suffix = 1;
  while (await fs.pathExists(baseFolder)) {
    baseFolder = path.join(planDir, `${finalStepId}-${timestamp}-${suffix++}`);
  }
  await fs.ensureDir(baseFolder);

  const mdPath = path.join(baseFolder, 'plan.md');
  // ⚠️ plan.json generation is now handled during `dokugent preview` sync only.
  // Do not generate JSON files inside `plan/`; markdown is the source of truth.
  if (!force && (await fs.pathExists(mdPath))) {
    console.log('⚠️ plan.md already exists. Use --force to overwrite.');
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
${answers.constraints.map((c) => `- ${c}`).join('\n')}

## Tools It Can Use
${toolSet.map(tool => `- ${tool}`).join('\n')}
`;

  await writeWithBackup(mdPath, planMdContent);

  console.log(`✅ plan.md created in ${baseFolder}/`);
  console.log(`ℹ️  Run 'dokugent plan sync' to regenerate plan.json`);

  const symlinkPath = path.join(planDir, finalStepId);
  try {
    await fs.remove(symlinkPath); // Remove existing symlink or folder
  } catch (e) {
    // No-op if it doesn't exist
  }
  await fs.symlink(baseFolder, symlinkPath, 'dir');
  console.log(`🔗 Symlink updated: ${finalStepId} → ${path.basename(baseFolder)}`);
}