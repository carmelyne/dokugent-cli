import path from 'path';
import fs from 'fs-extra';
import { promptPlanWizard } from '../utils/wizards/plan-wizard';
import { planLs } from '../utils/ls-utils';
import { updateSymlink } from '../utils/symlink-utils';

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
    default:
      await promptPlanWizard();
      break;
  }
}