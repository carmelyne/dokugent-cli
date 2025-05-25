/**
 * @file plan.ts
 * @description Handles subcommands related to planning agent steps.
 * Supports listing, linking, unlinking, and invoking the plan wizard.
 */
import path from 'path';
import fs from 'fs-extra';
import { promptPlanWizard } from '../utils/wizards/plan-wizard';
import { planLs } from '../utils/ls-utils';
import { updateSymlink } from '../utils/symlink-utils';
import { formatRelativePath } from '../utils/format-path';

/**
 * Executes the `plan` command dispatcher.
 *
 * Supported subcommands:
 * - `ls`: List existing plan steps and their symlinks.
 * - `symlink <stepId>@<version>`: Creates a symlink alias for a plan step.
 * - `use <stepId>@<version>`: Switches symlink to point to a specific version.
 * - `unlink <stepId>`: Removes a plan step symlink.
 * - (default): Launches the interactive plan wizard.
 *
 * @param args CLI arguments passed to `dokugent plan`.
 * @returns {Promise<void>}
 */
export async function runPlanCommand(args: string[]) {
  const sub = args[0];

  switch (sub) {
    case 'ls':
      await planLs();
      break;

    case 'symlink': {
      const [stepId, version] = (args[1] || '').split('@');
      if (!stepId || !version) {
        console.error('❌ Usage: dokugent plan symlink <stepId>@<version>');
        return;
      }
      const versionFolder = `${stepId}-${version}`;
      const planDir = path.resolve('.dokugent/plan');
      try {
        await updateSymlink(planDir, stepId, versionFolder);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Failed to update symlink: ${msg}`);
      }
      break;
    }

    case 'use': {
      const [stepId, version] = (args[1] || '').split('@');
      if (!stepId || !version) {
        console.error('❌ Usage: dokugent plan use <stepId>@<timestamp>');
        return;
      }
      const versionFolder = `${stepId}-${version}`;
      const planDir = path.resolve('.dokugent/plan');
      try {
        await updateSymlink(planDir, stepId, versionFolder);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Failed to switch symlink: ${msg}`);
      }
      break;
    }

    case 'unlink': {
      const stepId = args[1];
      if (!stepId) {
        console.error('❌ Usage: dokugent plan unlink <stepId>');
        return;
      }
      const aliasPath = path.resolve('.dokugent/plan', stepId);
      try {
        const stat = await fs.lstat(aliasPath);
        if (!stat.isSymbolicLink()) {
          console.error(`❌ '${stepId}' exists but is not a symlink.`);
          return;
        }
        await fs.remove(aliasPath);
        console.log(`🗑️ Removed symlink: ${stepId}`);
      } catch {
        console.error(`❌ No symlink named '${stepId}' found.`);
      }
      break;
    }

    case undefined:
    default: {
      const agentSymlink = path.resolve('.dokugent/data/agents/current');
      try {
        const agentId = await fs.readlink(agentSymlink);
        const activeLabel = agentSymlink.endsWith('latest') ? 'latest' : 'current';
        console.log(`\n📌 Using agent assigned as ${activeLabel}:\n   \x1b[32m${agentId}\x1b[0m`);
        const planCurrentSymlink = path.resolve('.dokugent/data/aplan', agentId, 'current');
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
              } catch {}

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
 * Resolves the path to the currently active plan for the active agent.
 * Returns null if no active agent or plan is found.
 */
async function resolveActivePlanPath(): Promise<string | null> {
  const agentSymlink = path.resolve('.dokugent/data/agents/current');
  try {
    const agentId = await fs.readlink(agentSymlink);
    const planCurrentSymlink = path.resolve('.dokugent/data/aplan', agentId, 'current');
    const resolvedPlanPath = await fs.readlink(planCurrentSymlink);
    return path.resolve('.dokugent/data/aplan', agentId, resolvedPlanPath);
  } catch {
    return null;
  }
}
