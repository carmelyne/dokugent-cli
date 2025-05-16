/**
 * @file criteria.ts
 * @description Runs the criteria wizard to capture filtering or gating logic
 * used by agent workflows during task evaluation.
 */
import { promptCriteriaWizard } from '../utils/wizards/criteria-wizard';

/**
 * Executes the interactive criteria wizard.
 * Used to define rule-based criteria for agent task selection or evaluation.
 *
 * @param force Optional boolean to bypass confirmation prompts.
 * @returns {Promise<void>}
 */
export async function runCriteria({ force = false } = {}) {
  await promptCriteriaWizard(force);
}