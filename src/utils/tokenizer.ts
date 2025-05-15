/**
 * Utility functions for token estimation and token limit warnings.
 * Reads agent context preferences from agents.yaml to ensure safe LLM usage.
 */

import { encode } from 'gpt-tokenizer';

interface TokenConfig {
  tokenLimit?: number;
  warnIfExceeds?: boolean;
  maxTokenLoad?: number;
}

/**
 * Estimates the number of tokens in a given string using GPT-style encoding.
 *
 * @param text - The input text to estimate token usage for.
 * @returns The number of estimated tokens.
 */
export function estimateTokensFromText(text: string = ''): number {
  return encode(text).length;
}

/**
 * Logs a warning if the token count exceeds the configured limit.
 *
 * @param agent - The name or ID of the agent being evaluated.
 * @param tokenCount - The number of estimated tokens.
 * @param config - Optional configuration object to override token limits and warning behavior.
 */
export function warnIfExceedsLimit(
  agent: string,
  tokenCount: number,
  config: TokenConfig = {}
): void {
  const {
    tokenLimit = 6000,
    warnIfExceeds = true,
    maxTokenLoad,
  } = config;

  const limit = maxTokenLoad || tokenLimit;

  if (!warnIfExceeds) return;

  if (tokenCount > limit) {
    console.warn(`⚠️ ${agent}: estimated ${tokenCount} tokens (limit: ${limit})`);
    console.warn(`   Tip: Consider trimming files or updating agent config in agents.yaml`);
  }
}