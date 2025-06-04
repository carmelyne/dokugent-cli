/**
 * @file plan.ts
 * @description Handles subcommands related to planning agent steps.
 * Supports listing, unlinking, and invoking the plan wizard.
 * - (no symlink/use for plans; plan steps are auto-resolved per agent)
 */
import path from 'path';
import fs from 'fs-extra';
import { readPlanFile, getPlanStepFile } from '../utils/plan-utils';
import { spawn } from 'child_process';
import { promptPlanWizard } from '../utils/wizards/plan-wizard';
// import { planLs } from '../utils/ls-utils';
// import { updateSymlink } from '../utils/symlink-utils';
import { formatRelativePath } from '../utils/format-path';
// import { planLs } from '@utils/ls-utils';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion } from '@utils/cli/ui';
import chalk from 'chalk';

/**
 * Executes the `plan` command dispatcher.
 *
 * Supported subcommands:
 * - `ls`: List existing plan steps and their symlinks.
 * - (no symlink/use for plans; plan steps are auto-resolved per agent)
 * - `unlink <stepId>`: Removes a plan step symlink.
 * - `compile`: Rebuilds plan.md using only steps marked as linked in plan.index.md.
 * - (default): Launches the interactive plan wizard.
 *
 * @param args CLI arguments passed to `dokugent plan`.
 * @returns {Promise<void>}
 */
export async function runPlanCommand(args: string[]) {
  const sub = ['--ls', 'ls'].includes(args[0]) ? 'ls' : args[0];

  switch (sub) {
    case 'compile': {
      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan folder found.');
        return;
      }

      const indexPath = path.join(planPath, 'plan.index.md');
      const stepFolder = path.join(planPath, 'steps');
      const outputPath = path.join(planPath, 'plan.md');

      if (!(await fs.pathExists(indexPath))) {
        console.error('❌ plan.index.md not found. Cannot compile plan.');
        return;
      }

      const lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
      const linkedSteps: string[] = [];

      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('Step ID')) {
          const cols = line.split('|').map(col => col.trim());
          if (cols[2] === 'linked') {
            linkedSteps.push(cols[1]);
          }
        }
      }

      if (!linkedSteps.length) {
        console.warn('⚠️ No linked steps found in plan.index.md.');
        return;
      }

      const files = await Promise.all(
        linkedSteps.map(async (stepId) => {
          const filePath = path.join(stepFolder, `${stepId}.md`);
          if (await fs.pathExists(filePath)) {
            return await fs.readFile(filePath, 'utf-8');
          } else {
            console.warn(`⚠️ Skipped missing step file: ${stepId}.md`);
            return '';
          }
        })
      );

      const compiled = files.filter(Boolean).join('\n\n---\n\n');
      await fs.writeFile(outputPath, `# PLAN.md\n\n${compiled}`, 'utf-8');
      console.log(`✅ plan.md compiled with ${linkedSteps.length} steps.`);
      return;
    }
    case '--show': {
      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan found to show.');
        return;
      }
      const fullPath = path.join(planPath, 'plan.md');
      const output = await readPlanFile(fullPath);
      console.log('\n' + output);
      return;
    }

    case '--edit': {
      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan found to edit.');
        return;
      }
      const stepId = args[1];
      if (!stepId) {
        console.error('❌ Usage: dokugent plan --edit <stepId>');
        return;
      }
      const filePath = await getPlanStepFile(planPath, stepId);
      if (!(await fs.pathExists(filePath))) {
        console.error(`❌ Step file not found: ${formatRelativePath(filePath)}`);
        return;
      }

      const child = spawn(process.env.EDITOR || 'nano', [filePath], {
        stdio: 'inherit',
      });
      await new Promise((resolve, reject) => {
        child.on('exit', code => (code === 0 ? resolve(null) : reject(code)));
      });
      return;
    }
    case '--check': {
      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan found to check.');
        return;
      }

      const stepFolder = path.join(planPath, 'steps');
      const stepFiles = (await fs.readdir(stepFolder)).filter(f => f.endsWith('.md'));

      const requiredSections = ['## Goal', '## Capabilities', '## Constraints', '## Tools It Can Use'];

      let hasError = false;
      for (const file of stepFiles) {
        const content = await fs.readFile(path.join(stepFolder, file), 'utf-8');
        const missing = requiredSections.filter(section => !content.includes(section));
        if (missing.length > 0) {
          hasError = true;
          console.warn(`⚠️  ${file} is missing: ${missing.join(', ')}`);
        }
      }

      if (!hasError) {
        console.log('✅ All step files passed structural checks.');
      }

      return;
    }
    case 'trace': {
      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan folder found.');
        return;
      }

      const indexPath = path.join(planPath, 'plan.index.md');
      const stepFolder = path.join(planPath, 'steps');

      if (!(await fs.pathExists(indexPath))) {
        console.warn('⚠️ plan.index.md not found. Creating empty index...');
        await fs.writeFile(indexPath, '', 'utf-8');
      }

      const lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');

      console.log(`\n📍 Plan Trace (${path.basename(planPath)})\n`);

      console.log('🗂️  plan.index.md');
      // Collect step metadata
      const stepMeta: { stepId: string, status: string, exists: boolean, tokens?: number }[] = [];
      const linkedSteps: string[] = [];

      for (const line of lines) {
        if (!line.includes(' - ')) continue;
        const [stepId, status] = line.split(' - ').map(s => s.trim());
        const filePath = path.join(stepFolder, `${stepId}.md`);
        const exists = await fs.pathExists(filePath);
        const meta: { stepId: string, status: string, exists: boolean, tokens?: number } = { stepId, status, exists };
        if (status === 'linked' && exists) {
          const content = await fs.readFile(filePath, 'utf-8');
          meta.tokens = Math.ceil(content.split(/\s+/).length / 0.75);
        }
        stepMeta.push(meta);
      }

      // Sort linked first, then unlinked; each group alphabetically
      const sortedMeta = stepMeta.sort((a, b) => {
        if (a.status === b.status) return a.stepId.localeCompare(b.stepId);
        return a.status === 'linked' ? -1 : 1;
      });

      for (const meta of sortedMeta) {
        const icon = meta.status === 'linked'
          ? meta.exists ? '✅' : '⚠️'
          : '⛔';
        const tokenNote = meta.tokens ? `  ~${meta.tokens} tokens` : '';
        console.log(`  - ${meta.stepId.padEnd(20)} → ${meta.status} ${icon}${tokenNote}`);
        if (meta.status === 'linked' && meta.exists) linkedSteps.push(meta.stepId);
      }

      if (linkedSteps.length) {
        console.log('\n📦 Resolved Compilation Order:');
        linkedSteps.forEach((step, i) => {
          console.log(`  ${i + 1}. ${step}`);
        });
        // --- Begin estimated total tokens block
        const tokenEstimates = await Promise.all(
          linkedSteps.map(async (stepId) => {
            const filePath = path.join(stepFolder, `${stepId}.md`);
            const content = await fs.readFile(filePath, 'utf-8');
            return Math.ceil(content.split(/\s+/).length / 0.75);
          })
        );
        const totalTokens = tokenEstimates.reduce((sum, tokens) => sum + tokens, 0);
        console.log(`\n🧮 Estimated Total Tokens: \x1b[32m~${totalTokens}\x1b[0m tokens in plan.md\n`);
        // --- End estimated total tokens block
      } else {
        console.log('\n⚠️ No linked steps found.\n');
      }

      return;
    }
    case '--t': {
      const stepId = args[1];
      if (!stepId) {
        console.error('❌ Missing step ID.\nUsage: dokugent plan --t <stepId>');
        return;
      }

      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan folder found.');
        return;
      }

      const stepFolder = path.join(planPath, 'steps');
      const filePath = path.join(stepFolder, `${stepId}.md`);
      const indexPath = path.join(planPath, 'plan.index.md');

      if (await fs.pathExists(filePath)) {
        console.warn(`⚠️ Step file ${stepId}.md already exists.`);
        return;
      }

      const content = `## Plan Step ID
${stepId}

## Plan Description

## Agent Name
${path.basename(planPath)}

## Agent Role

## Goal

## Capabilities
1.

## Constraints
-

## Tools It Can Use
-
`;

      await fs.writeFile(filePath, content, 'utf-8');

      let lines: string[] = [];
      if (await fs.pathExists(indexPath)) {
        lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
      }

      const alreadyListed = lines.some(line => line.trim().startsWith(`${stepId} -`));
      if (!alreadyListed) {
        lines.push(`${stepId} - linked`);
        await fs.writeFile(indexPath, lines.join('\n'), 'utf-8');
      }

      console.log(`\n✅ Created step '${stepId}' from empty template and linked it.\n`);
      return;
    }
    case 'ls': {
      const planDir = path.resolve('.dokugent/data/plans');
      const exists = await fs.pathExists(planDir);
      if (!exists) {
        console.error('❌ No plan folder found.');
        return;
      }

      const entries = await fs.readdir(planDir);
      const plans = entries.filter(name => name.includes('@'));
      const symlinks = [];

      for (const name of entries) {
        if (!name.includes('@')) {
          const stat = await fs.lstat(path.join(planDir, name));
          if (stat.isSymbolicLink()) {
            symlinks.push(name);
          }
        }
      }

      if (plans.length) {
        paddedLog('dokugent plan list', '', PAD_WIDTH, 'info');
        paddedDefault("Available Plan Versions", `(${plans.length})`, PAD_WIDTH, 'magenta', 'PLANS');
        for (const name of plans) {
          paddedSub('', `${glyphs.arrowRight} ${name}`);
        }
      } else {
        paddedLog('Uh oh...', 'No plan versions found.', PAD_WIDTH, 'warn');
      }

      if (symlinks.length) {
        // paddedDefault("Symlinks", `(${symlinks.length})`, PAD_WIDTH, 'blue', 'PLANS');
        const symlinkLines = await Promise.all(
          symlinks.map(async name => {
            const target = await fs.readlink(path.join(planDir, name));
            const color = name === 'latest' ? chalk.magenta : name === 'current' ? chalk.green : chalk.gray;
            const isCurrent = name === 'current';
            const glyph = isCurrent ? `${glyphs.check} ` : '  ';
            const labelText = name.padEnd(8);
            const label = color(labelText);
            return `${glyph}${label} → ${path.basename(target)}`;
          })
        );
        paddedSub('', symlinkLines.join('\n'));
        paddedLog(
          'To assign a version as the current agent',
          'dokugent plan --use <agent>@<birthstamp>',
          PAD_WIDTH,
          'blue',
          'HELP'
        );
        console.log();
      } else {
        console.log('\n📭 No symlinks found.');
      }

      return;
    }

    case 'unlink': {
      const stepId = args[1];
      if (!stepId) {
        const planPath = await resolveActivePlanPath();
        if (!planPath) {
          console.error('❌ No active plan folder found.');
          return;
        }

        const indexPath = path.join(planPath, 'plan.index.md');
        if (!(await fs.pathExists(indexPath))) {
          console.error('❌ plan.index.md not found.');
          return;
        }

        // Read all lines, only process lines with ' - ', and filter for 'linked'
        const lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
        const stepIds = lines
          .map(line => line.trim())
          .filter(line => line.includes(' - '))
          .map(line => {
            const [step, status] = line.split(' - ').map(s => s.trim());
            return { step, status };
          })
          .filter(({ status }) => status === 'linked')
          .map(({ step }) => step);

        console.error('\n❌ Missing step ID.\n');
        console.log('📋 Available step IDs:\n');
        for (const id of stepIds) {
          console.log(`  - ${id}`);
        }

        console.log('\nTo remove a step from your plan, use:\n');
        console.log('  dokugent plan unlink <stepId>\n');
        console.log('Example:\n\n  dokugent plan unlink summarize_input\n');
        return;
      }

      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan folder found.');
        return;
      }

      const indexPath = path.join(planPath, 'plan.index.md');
      if (!(await fs.pathExists(indexPath))) {
        console.error('❌ plan.index.md not found. Cannot unlink step.');
        return;
      }

      // Only process valid lines with ' - '
      const lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
      let modified = false;

      const updatedLines = lines.map(line => {
        if (line.includes(' - ')) {
          const [id, status] = line.split(' - ').map(s => s.trim());
          if (id === stepId && status === 'linked') {
            modified = true;
            return `${id} - unlinked`;
          }
        }
        return line;
      });

      if (!modified) {
        console.warn(`\n⚠️ Step '${stepId}' not found or already unlinked.\n`);
        return;
      }

      await fs.writeFile(indexPath, updatedLines.join('\n'), 'utf-8');

      // Recompile plan.md
      const outputPath = path.join(planPath, 'plan.md');
      const stepFolder = path.join(planPath, 'steps');

      // Only process valid lines, only those with 'linked'
      const linkedSteps = updatedLines
        .map(line => line.trim())
        .filter(line => line.includes(' - '))
        .map(line => {
          const [step, status] = line.split(' - ').map(s => s.trim());
          return { step, status };
        })
        .filter(({ status }) => status === 'linked')
        .map(({ step }) => step);

      const files = await Promise.all(
        linkedSteps.map(async (stepId) => {
          const filePath = path.join(stepFolder, `${stepId}.md`);
          if (await fs.pathExists(filePath)) {
            return await fs.readFile(filePath, 'utf-8');
          } else {
            console.warn(`⚠️ Skipped missing step file: ${stepId}.md`);
            return '';
          }
        })
      );

      const compiled = files.filter(Boolean).join('\n\n---\n\n');
      await fs.writeFile(outputPath, `# PLAN.md\n\n${compiled}`, 'utf-8');
      console.log(`\n✅ Step '${stepId}' unlinked and plan.md recompiled.\n`);
      break;
    }
    case 'link': {
      const stepId = args[1];
      if (!stepId) {
        const planPath = await resolveActivePlanPath();
        if (!planPath) {
          console.error('❌ No active plan folder found.');
          return;
        }

        const indexPath = path.join(planPath, 'plan.index.md');
        if (!(await fs.pathExists(indexPath))) {
          console.error('❌ plan.index.md not found.');
          return;
        }

        // Read all lines, only process lines with ' - ', and filter for 'unlinked'
        const lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
        const stepIds = lines
          .map(line => line.trim())
          .filter(line => line.includes(' - '))
          .map(line => {
            const [step, status] = line.split(' - ').map(s => s.trim());
            return { step, status };
          })
          .filter(({ status }) => status === 'unlinked')
          .map(({ step }) => step);

        console.error('\n❌ Missing step ID.\n');
        console.log('📋 Available step IDs:\n');
        for (const id of stepIds) {
          console.log(`  - ${id}`);
        }

        console.log('\nTo add a step back to your plan, use:\n');
        console.log('  dokugent plan link <stepId>\n');
        console.log('Example:\n\n  dokugent plan link summarize_input\n');
        return;
      }

      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan folder found.');
        return;
      }

      const indexPath = path.join(planPath, 'plan.index.md');
      if (!(await fs.pathExists(indexPath))) {
        console.error('❌ plan.index.md not found. Cannot link step.');
        return;
      }

      // Only process valid lines with ' - '
      const lines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
      let modified = false;

      const updatedLines = lines.map(line => {
        if (line.includes(' - ')) {
          const [id, status] = line.split(' - ').map(s => s.trim());
          if (id === stepId && status === 'unlinked') {
            modified = true;
            return `${id} - linked`;
          }
        }
        return line;
      });

      if (!modified) {
        console.warn(`⚠️ Step '${stepId}' not found or already linked.`);
        return;
      }

      await fs.writeFile(indexPath, updatedLines.join('\n'), 'utf-8');

      // Recompile plan.md
      const outputPath = path.join(planPath, 'plan.md');
      const stepFolder = path.join(planPath, 'steps');

      // Only process valid lines, only those with 'linked'
      const linkedSteps = updatedLines
        .map(line => line.trim())
        .filter(line => line.includes(' - '))
        .map(line => {
          const [step, status] = line.split(' - ').map(s => s.trim());
          return { step, status };
        })
        .filter(({ status }) => status === 'linked')
        .map(({ step }) => step);

      const files = await Promise.all(
        linkedSteps.map(async (stepId) => {
          const filePath = path.join(stepFolder, `${stepId}.md`);
          if (await fs.pathExists(filePath)) {
            return await fs.readFile(filePath, 'utf-8');
          } else {
            console.warn(`⚠️ Skipped missing step file: ${stepId}.md`);
            return '';
          }
        })
      );

      const compiled = files.filter(Boolean).join('\n\n---\n\n');
      await fs.writeFile(outputPath, `# PLAN.md\n\n${compiled}`, 'utf-8');
      console.log(`\n✅ Step '${stepId}' linked and plan.md recompiled.\n`);
      break;
    }

    case '--doctor': {
      // Support --fix-all flag
      const fixAll = args.includes('--fix-all');
      const scrub = fixAll || args.includes('--scrub');
      const createMissing = fixAll || args.includes('--create-missing');
      const rebuildIndex = args.includes('--rebuild-index');

      const planPath = await resolveActivePlanPath();
      if (!planPath) {
        console.error('❌ No active plan folder found.');
        return;
      }

      const stepFolder = path.join(planPath, 'steps');
      const indexPath = path.join(planPath, 'plan.index.md');

      const stepFiles = (await fs.readdir(stepFolder))
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));

      // --- --rebuild-index logic
      if (rebuildIndex) {
        const rebuiltLines = stepFiles.map(stepId => `${stepId} - unlinked`);
        await fs.writeFile(indexPath, rebuiltLines.join('\n'), 'utf-8');

        if (rebuiltLines.length) {
          console.log('\n🔧 Actions Taken\n');
          console.log('🔁 Rebuilt plan.index.md from step files:\n');
          rebuiltLines.forEach(line => {
            console.log(`   ${line}`);
          });
        } else {
          console.log('\n🔧 Actions Taken\n');
          console.log('🔁 No step files found to rebuild index.');
        }

        console.log('\n_____\n\n✅ plan doctor completed.\n');
        return;
      }

      // --- New logic: create missing plan.index.md and set createdIndex flag
      let createdIndex = false;
      if (!(await fs.pathExists(indexPath))) {
        console.warn('⚠️ plan.index.md not found. Creating empty index file.');
        await fs.writeFile(indexPath, '', 'utf-8');
        createdIndex = true;
      }

      const indexLines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
      const listedSteps = indexLines
        .map(line => line.trim())
        .filter(line => line.includes(' - '))
        .map(line => {
          const [stepId, status] = line.split(' - ').map(s => s.trim());
          return { stepId, status };
        });

      const listedStepIds = listedSteps.map(({ stepId }) => stepId);
      const missingFiles = listedSteps.filter(({ stepId }) => !stepFiles.includes(stepId));
      const unlistedFiles = stepFiles.filter(id => !listedStepIds.includes(id));

      // ---- Status Report Section
      // If we created the index, always print Status Report header
      if (createdIndex) {
        console.log('\n📋 Status Report:\n');
      }
      let printedStatusHeader = createdIndex;
      if (missingFiles.length) {
        if (!printedStatusHeader) {
          console.log('\n📋 Status Report:\n');
          printedStatusHeader = true;
        }
        console.warn(`⚠️ Listed in plan.index.md but missing .md file:`);
        for (const { stepId } of missingFiles) {
          console.log(`   - ${stepId}`);
        }
      }

      if (unlistedFiles.length) {
        if (!printedStatusHeader) {
          console.log('\n📋 Status Report:\n');
          printedStatusHeader = true;
        }
        console.warn(`⚠️ Found step files not listed in plan.index.md:`);
        for (const id of unlistedFiles) {
          console.log(`  - ${id}.md`);
        }
      }

      if (!missingFiles.length && !unlistedFiles.length && !createdIndex) {
        console.log('\n✅ plan.index.md and steps folder are in sync.\n');
        return;
      }

      // ---- Actions Taken Section
      let didActions = false;
      if (scrub || createMissing) {
        console.log('\n🔧 Actions Taken:\n');
        didActions = true;
      }

      // Add logic to handle --scrub and --create-missing (and --fix-all)
      const origLines = (await fs.readFile(indexPath, 'utf-8')).split('\n');
      const updatedLines = [];
      for (const line of origLines) {
        const trimmed = line.trim();
        if (!trimmed.includes(' - ')) {
          updatedLines.push(line);
          continue;
        }
        const [stepId, status] = trimmed.split(' - ').map(s => s.trim());
        if (scrub) {
          // Remove if .md file does not exist (regardless of status)
          const stepFilePath = path.join(stepFolder, `${stepId}.md`);
          // eslint-disable-next-line no-await-in-loop
          if (!(await fs.pathExists(stepFilePath))) {
            console.log(`🧹 Scrubbed from plan.index.md:\n   - ${stepId}`);
            continue; // skip this line (scrub)
          }
        }
        updatedLines.push(line);
      }
      await fs.writeFile(indexPath, updatedLines.join('\n'), 'utf-8');

      if (createMissing) {
        for (const { stepId } of listedSteps) {
          const filePath = path.join(stepFolder, `${stepId}.md`);
          // Only create if file does not exist
          if (!(await fs.pathExists(filePath))) {
            const content = `## Plan Step ID
${stepId}

## Plan Description

## Agent Name
${path.basename(planPath)}

## Agent Role

## Goal

## Capabilities
1.

## Constraints
-

## Tools It Can Use
-
`;
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`📝 Created missing step file: ${stepId}.md`);
          }
        }
      }

      // ---- Completion Banner
      console.log('\n_____\n\n✅ plan doctor completed.\n');
      return;
    }

    case undefined:
    default: {
      const agentSymlink = path.resolve('.dokugent/data/agents/current');
      try {
        const agentId = await fs.readlink(agentSymlink);
        const activeLabel = agentSymlink.endsWith('latest') ? 'latest' : 'current';
        console.log(`\n📌 Using agent assigned as ${activeLabel}:\n   \x1b[32m${agentId}\x1b[0m`);
        const planCurrentSymlink = path.resolve('.dokugent/data/plans', agentId, 'current');
        let resolvedPlanPath: string | null = null;

        if (await fs.pathExists(planCurrentSymlink)) {
          try {
            resolvedPlanPath = await fs.readlink(planCurrentSymlink);
            const planPath = path.resolve('.dokugent/data/plans', agentId, resolvedPlanPath);
            console.log(`📂 Active plan: ${planPath}`);
          } catch {
            resolvedPlanPath = null;
          }
        }

        if (!resolvedPlanPath) {
          const planDir = path.resolve('.dokugent/data/plans');
          const all = await fs.readdir(planDir);
          // Only show symlinks that don't have '-' in their name (step aliases)
          const symlinks = [];
          for (const name of all) {
            if (!name.includes('-')) {
              const stat = await fs.lstat(path.join(planDir, name));
              if (stat.isSymbolicLink()) {
                symlinks.push(name);
              }
            }
          }
          if (symlinks.length) {
            for (const step of symlinks) {
              const link = await fs.readlink(path.join(planDir, step));
              const linkPath = path.resolve(planDir, link);
              const stepsDir = path.join(linkPath, 'steps');
              let stepFiles: string[] = [];
              try {
                stepFiles = (await fs.readdir(stepsDir))
                  .filter(f => f.endsWith('.md'))
                  .map(f => f.replace('.md', ''));
              } catch { }

              if (stepFiles.length) {
                console.log(`\n📂 Steps in - \x1b[34m${step}\x1b[0m → ${formatRelativePath(linkPath)}`);
                for (const file of stepFiles) {
                  console.log(`   - ${file}`);
                }
              }
            }
          }
        }

        console.log('\n🛠️ Launching plan wizard for new or custom steps...\n');
        await promptPlanWizard();
      } catch {
        const agentExists = await fs.pathExists(agentSymlink);
        if (!agentExists) {
          console.error('❌ No active agent profile found. Run `dokugent agent use <name>` first.');
          return;
        }
        console.warn('\n⚠️ No active plan found. Launching wizard...\n');
        await promptPlanWizard();
      }
      break;
    }
  }
}
/**
 * Resolves the path to the currently active plan (latest) for the agent.
 * Returns null if no active plan is found.
 */
async function resolveActivePlanPath(): Promise<string | null> {
  const planBase = path.resolve('.dokugent/data/plans');

  // Try current first
  const currentPath = path.join(planBase, 'current');
  if (await fs.pathExists(currentPath)) {
    try {
      const currentTarget = await fs.readlink(currentPath);
      return path.resolve(planBase, currentTarget);
    } catch { }
  }

  // Fallback to latest
  const latestPath = path.join(planBase, 'latest');
  if (await fs.pathExists(latestPath)) {
    try {
      const latestTarget = await fs.readlink(latestPath);
      return path.resolve(planBase, latestTarget);
    } catch { }
  }

  return null;
}
