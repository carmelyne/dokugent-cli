

import { promptPlanWizard } from '../utils/wizards/plan-wizard';
import { planLs } from '../utils/ls-utils';

export async function runPlanCommand(args: string[]) {
  const sub = args[0];

  switch (sub) {
    case 'ls':
      await planLs();
      break;

    case undefined:
    default:
      await promptPlanWizard();
      break;
  }
}