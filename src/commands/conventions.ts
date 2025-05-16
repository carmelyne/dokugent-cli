/**
 * @file conventions.ts
 * @description Runs the conventions wizard to help users define project-wide or agent-specific conventions.
 */
import { promptConventionsWizard } from '../utils/wizards/conventions-wizard';

/**
 * Executes the interactive conventions wizard.
 * Typically invoked early to establish conventions for a project or agent workflow.
 *
 * @returns {Promise<void>}
 */
export async function runConventions() {
  await promptConventionsWizard();
}
