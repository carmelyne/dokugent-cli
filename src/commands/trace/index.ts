import { runTraceAgent } from "@domain/trace/runner";

// Basic runner for testing without Oclif
const args = process.argv.slice(2);
const dokuUri = args[0];
const token = args[1]; // optional
const input = args[2]; // optional

if (!dokuUri) {
  console.error("❌ Missing dokuUri. Usage: node index.js <dokuUri> [token] [input]");
  process.exit(1);
}


(async () => {
  try {
    const result = await runTraceAgent({ dokuUri, token });
    if (result === undefined) {
      console.error("❌ Trace returned undefined. Possible causes:");
      console.error("- No response from runTraceAgent");
      console.error("- Agent URI may be invalid");
      console.error("- Missing or invalid headers");
    } else {
      console.log("✅ Trace result:");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err: any) {
    console.error("❌ Error tracing agent:", err.message);
    console.error("🔍 Full error:", err);
    process.exit(1);
  }
})();
