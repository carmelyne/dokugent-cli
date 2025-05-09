// export function estimateTokensFromText(text = '') {
//   return Math.round(text.length / 4);
// }

// export function warnIfExceedsLimit(agent, tokenCount, config = {}) {
//   const { tokenLimit = 6000, warnIfExceeds = true } = config;

//   if (!warnIfExceeds) return;

//   if (tokenCount > tokenLimit) {
//     console.warn(`⚠️ ${agent}: estimated ${tokenCount} tokens (limit: ${tokenLimit})`);
//     console.warn(`   Tip: Consider trimming files or updating llm-load.yml`);
//   }
// }
// Requires: npm install gpt-tokenizer
import { encode } from 'gpt-tokenizer';

export function estimateTokensFromText(text = '') {
  return encode(text).length;
}

export function warnIfExceedsLimit(agent, tokenCount, config = {}) {
  const {
    tokenLimit = 6000,
    warnIfExceeds = true,
    maxTokenLoad
  } = config;

  const limit = maxTokenLoad || tokenLimit;

  if (!warnIfExceeds) return;

  if (tokenCount > limit) {
    console.warn(`⚠️ ${agent}: estimated ${tokenCount} tokens (limit: ${limit})`);
    console.warn(`   Tip: Consider trimming files or updating agent config in agents.yaml`);
  }
}