import { promptOwnerWizard } from '../../utils/wizards/owner-wizard';
import { runOwnerEdit } from './edit';

export async function runOwnerCommand(rawArgs?: string[]): Promise<void> {
  const args = rawArgs ?? process.argv.slice(2);

  if (args.includes('--edit')) {
    await runOwnerEdit();
  } else {
    await promptOwnerWizard();
  }
}
