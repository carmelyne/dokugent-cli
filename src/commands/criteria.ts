import { promptCriteriaWizard } from '../utils/wizards/criteria-wizard';

export async function runCriteria({ force = false } = {}) {
  await promptCriteriaWizard(force);
}