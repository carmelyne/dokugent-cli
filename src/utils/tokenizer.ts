/**
 * @file tokenizer.ts
 * @description Utility functions for estimating token usage and logging token limit warnings.
 * Uses GPT-style encoding to calculate token counts for agent inputs and JSON bundles.
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
 * @param text - The input string to tokenize.
 * @returns {number} The estimated number of tokens.
 */
export function estimateTokensFromText(text: string = ''): number {
  return encode(text).length;
}

/**
 * Logs a warning if the estimated token count exceeds a configured limit.
 *
 * @param agent - Name or ID of the agent being evaluated.
 * @param tokenCount - Number of tokens detected in the content.
 * @param config - Optional configuration to customize limits and warning behavior.
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