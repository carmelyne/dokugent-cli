/**
 * @docLetter v0.1
 * @llmRole: status operator
 * @trustLevel: internal
 * @expectedRuntime: dynamic
 * @description: Command to resolve and display current system trust levels, refusal codes, and status labels. Acts as a diagnostic and governance tool.
 * @context:
 * - Reads from `src/statuses/trust-levels.ts`
 * - Used in workflows like `preview`, `compile`, `simulate`, and `certify` to resolve refusal conditions
 * @execRules:
 * - Run only when CLI has read-access to trust-level definitions and refusal metadata
 * - Primary role is to verify and expose which execution-blocking reasons are currently active
 * - Should be extended in future to include scopes for ethica and simulate
 * - Emits refusal codes that block downstream execution if security or trust criteria are not met
 */
import { trustLevels } from '../../statuses/trust-levels';
import { refusalCodes } from '../../statuses/refusal-codes';
import { executionModes } from '../../statuses/execution-modes';
import { statusCategories } from '../../statuses/status-categories';

export function runStatusCommand(flags?: { json?: boolean }) {
  if (flags?.json) {
    console.log(JSON.stringify({
      trustLevels,
      refusalCodes,
      executionModes,
      statusCategories,
    }, null, 2));
    return;
  }

  console.log('/** @caretag: status:trust-levels */');
  console.log('\nTrust Levels:\n');
  for (const [level, description] of Object.entries(trustLevels)) {
    console.log(`  • ${level} → ${description}`);
  }

  console.log('\n/** @caretag: status:refusal-codes */');
  console.log('\nRefusal Codes:\n');
  for (const [code, reason] of Object.entries(refusalCodes)) {
    console.log(`  • ${code} → ${reason}`);
  }

  console.log('\n/** @caretag: status:execution-modes */');
  console.log('\nExecution Modes:\n');
  for (const [mode, desc] of Object.entries(executionModes)) {
    console.log(`  • ${mode} → ${desc}`);
  }

  console.log('\n/** @caretag: status:status-categories */');
  console.log('\nStatus Categories:\n');
  for (const [cat, explanation] of Object.entries(statusCategories)) {
    console.log(`  • ${cat} → ${explanation}`);
  }
}
