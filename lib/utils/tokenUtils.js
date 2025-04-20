export function estimateTokensFromText(text = '') {
  return Math.round(text.length / 4);
}

export function warnIfExceedsLimit(agent, tokenCount, config = {}) {
  const { tokenLimit = 6000, warnIfExceeds = true } = config;

  if (!warnIfExceeds) return;

  if (tokenCount > tokenLimit) {
    console.warn(`⚠️ ${agent}: estimated ${tokenCount} tokens (limit: ${tokenLimit})`);
    console.warn(`   Tip: Consider trimming files or updating llm-load.yml`);
  }
}
