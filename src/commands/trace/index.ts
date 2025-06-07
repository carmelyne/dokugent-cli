import { runTraceAgent } from "@domain/trace/runner";
import { slowPrint } from '@utils/cli/slowPrint';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault } from '@utils/cli/ui';

export async function runTraceCommand(args: string[]) {
  const dokuUri = args[0];
  const tokenArgIndex = args.findIndex(arg => arg === '--token');
  const token = tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : undefined;

  if (!dokuUri) {
    console.error('\n❌ Missing required dokuUri.\nUsage: dokugent trace <dokuUri> [--token <your_token>]\n');
    process.exit(1);
  }

  try {
    const result = await runTraceAgent({ dokuUri, token });
    if (!result) {
      console.error("❌ Trace returned undefined. Possible issues:");
      console.error("- Agent URI is incorrect or not found.");
      console.error("- Server is not responding or misconfigured.");
      console.error("- Authorization headers might be missing.");
      return;
    }

    console.log()
    paddedCompact('dokugent trace initialized...', '', PAD_WIDTH, 'blue');
    if (result) {
      const pretty = JSON.stringify(result, null, 1);
      paddedSub('', 'Trace Result');
      await slowPrint(pretty, 1); //slowPrint Speed Set
      paddedLog('Trace Completed.', '', 12, 'success', 'TRACE');
      const agentNameAtBTS = dokuUri.split('/').pop()?.split('.').shift() || 'agent@timestamp';
      paddedCompact('To inspect the agent', `dokugent inspect doku://${agentNameAtBTS}  --show owner `, PAD_WIDTH, 'blue', 'HELP');
      paddedSub('Details you can query via --show', 'agent, conventions, criteria, metadata, owner, plan',); //indented white text
    }
  } catch (error: any) {
    console.error("❌ Error tracing agent:", error.message);
    console.error("🔍 Full error:", error);
    process.exit(1);
  }
}
