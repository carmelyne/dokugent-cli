import { runTraceAgent } from "@domain/trace/runner";

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

    console.log("🔍 Raw trace result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Error tracing agent:", error.message);
    console.error("🔍 Full error:", error);
    process.exit(1);
  }
}
