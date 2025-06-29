import path from 'path';
import { runSimulateViaMistral, runSimulateViaEthica } from '../../utils/simulate-runner';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';
import { wrapWithHangingIndent } from '@utils/cli/wrap-utils';
import chalk from 'chalk';
import { getCurrentAgentSlug } from '@utils/agent-utils';
import { estimateTokensFromText } from '@utils/tokenizer';
import { runTokenTrustCheck } from '@utils/security/token-check';

export async function runSimulateCommand(flags: { llm?: string; configPath?: string; human?: string }, options?: {
  debateOnly?: boolean;
  roundtableOnly?: boolean;
  reactOnly?: boolean;
  labOnly?: boolean;
  agendaOnly?: boolean;
  propagandaOnly?: boolean;
}) {
  const isEthicaMode = process.argv.includes('--ethica');
  if (isEthicaMode) {
    const isDebateOnly = process.argv.includes('--debate');
    const isRoundtable = process.argv.includes('--roundtable');
    console.log();
    paddedCompact('Ethica simulation mode activated.', '', PAD_WIDTH, 'info');
    if (isDebateOnly) {
      paddedSub('🗣️ Debate-only flag active.', 'Filtering for contrarian & disruptor personas.');
    }
    console.log('🧠 Starting Ethica simulation via runSimulateViaEthica...\n');
    const promptContext = flags.human || "[No human input provided]";
    const estimatedTokens = estimateTokensFromText(promptContext);
    runTokenTrustCheck({ estimatedTokens, context: 'simulate' });
    const ethicaInput = {
      llm: flags.llm || process.env.OPENAI_MODEL || 'openai:gpt-4o',
      configPath: flags.configPath || path.resolve('src/config/ethica/shared/default.config.json'),
      debateOnly: options?.debateOnly || false,
      roundtableOnly: isRoundtable,
    };
    await runSimulateViaEthica({
      ...ethicaInput,
      debateOnly: isDebateOnly,
      roundtableOnly: isRoundtable,
      human: flags.human || "[No human input provided]"
    });
    console.log('\n✅ Ethica simulation complete.\n');
    paddedDefault(' ', 'Ethica simulation complete. No LLMs were harmed', 'info', 'COMPLETED');
    console.log()
    return;
  }
  console.log()
  paddedCompact('dokugent simulate initialized...', '', PAD_WIDTH, 'info');
  try {
    const promptContext = flags.human || "[No human input provided]";
    const estimatedTokens = estimateTokensFromText(promptContext);
    runTokenTrustCheck({ estimatedTokens, context: 'simulate' });
    await runSimulateViaMistral();
    console.log()
    paddedDefault(' ', 'Simulation complete. No LLMs were harmed', 'info', 'COMPLETED');
    console.log()
    // console.log('\n✅ \x1b[1mSimulation complete. No LLMs were harmed.\x1b[22m\n');
  } catch (err: any) {
    // console.error('\n❌ Simulation failed:', err.message);
    console.log()
    paddedDefault('Simulation failed', '✖ ' + err.message, PAD_WIDTH, 'orange', 'FAILED');
    console.log()
  }
  const currentAgent = getCurrentAgentSlug();
  paddedLog('To trace the agent remotely', ` dokugent trace doku://${currentAgent}`, PAD_WIDTH, 'blue', 'HELP');
  console.log()
}
