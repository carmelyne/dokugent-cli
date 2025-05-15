import { promptConventionsWizard } from '../utils/wizards/conventions-wizard';

export async function runConventions() {
  await promptConventionsWizard();
}
