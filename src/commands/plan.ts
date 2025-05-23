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
        const planCurrentSymlink = path.resolve('.dokugent/data/aplan', agentId, 'current');
        const resolvedPlanPath = await fs.readlink(planCurrentSymlink);
        const planPath = path.resolve('.dokugent/data/aplan', agentId, resolvedPlanPath);
        console.log(`📂 Active plan: ${planPath}`);
        // future: load or present options for the plan
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
