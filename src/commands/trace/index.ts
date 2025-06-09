import path from 'path';
import fs from 'fs';
import { runTraceAgent } from "@domain/trace/runner";
import { slowPrint } from '@utils/cli/slowPrint';
import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault } from '@utils/cli/ui';

function safeFolderSlug(agentId: string): string {
  return agentId.replace('@', '__');
}

export async function runTraceCommand(args: string[]) {
  const dokuUri = args[0];
  const tokenArgIndex = args.findIndex(arg => arg === '--token');
  const token = tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : undefined;

  if (!dokuUri) {
    console.error('\n❌ Missing required dokuUri.\nUsage: dokugent trace <dokuUri> [--token <your_token>]\n');
    process.exit(1);
  }

  try {
    let finalUri = dokuUri;

    // Fallback logic: if it's *.compiled.cert.json without version, resolve latest vXX
    if (dokuUri.endsWith('.compiled.cert.json')) {
      const baseName = path.basename(dokuUri, '.compiled.cert.json');
      const agentId = baseName; // e.g., merrybot@2025-06-08_04-16-35-246
      const folderName = safeFolderSlug(agentId);
      const compiledPath = path.join('.dokugent/ops/compiled', folderName);

      if (!fs.existsSync(compiledPath)) {
        throw new Error(`❌ Compiled folder not found: ${compiledPath}`);
      }

      const files = fs.readdirSync(compiledPath)
        .filter(f => f.includes('.compiled.v') && f.endsWith('.cert.json'))
        .sort((a, b) => {
          const version = (f: string) => parseInt(f.match(/\.v(\d+)\.cert\.json$/)?.[1] || '0');
          return version(b) - version(a);
        });

      if (files.length === 0) {
        throw new Error(`❌ No versioned cert files found in ${compiledPath}`);
      }

      finalUri = path.join(compiledPath, files[0]);
    }

    const result = await runTraceAgent({ dokuUri: finalUri, token });
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

      // Estimate and log token count for trace output
      const tokenEstimate = JSON.stringify(result || {}).length / 4;
      paddedLog('Estimated trace output tokens', `~${Math.ceil(tokenEstimate)} tokens`, PAD_WIDTH, 'pink', 'TOKENS');
      console.log()
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
