import { runSimulateViaMistral } from '../../utils/simulate-runner';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';
import { wrapWithHangingIndent } from '@utils/cli/wrap-utils';
import chalk from 'chalk';
import { getCurrentAgentSlug } from '@utils/agent-utils';

export async function runSimulateCommand() {
  console.log()
  paddedCompact('dokugent simulate initialized...', '', PAD_WIDTH, 'info');
  try {
    await runSimulateViaMistral();
    console.log()
    paddedDefault(' ', 'Simulation complete. No LLMs were harmed', 'info', 'COMPLETED');
    // console.log('\n✅ \x1b[1mSimulation complete. No LLMs were harmed.\x1b[22m\n');
  } catch (err: any) {
    // console.error('\n❌ Simulation failed:', err.message);
    console.log()
    paddedDefault('Simulation failed', '✖ ' + err.message, PAD_WIDTH, 'orange', 'FAILED');
    console.log()
  }
  const currentAgent = getCurrentAgentSlug(); // e.g., merrybot@2025-06-08_04-16-35-246
  paddedLog('To trace the agent remotely', ` dokugent trace doku://${currentAgent}`, PAD_WIDTH, 'blue', 'HELP');
  console.log()
}
