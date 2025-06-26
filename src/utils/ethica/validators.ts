

import { z } from 'zod';

export const structuredReplySchema = z.object({
  llm: z.string(), // e.g., 'openai:gpt-4o'
  persona: z.string(), // e.g., 'contrarian'
  scenario: z.string(), // raw scenario prompt string
  humanStance: z.string(), // human viewpoint or argument
  summary: z.string(), // LLM's summarized position
  verdict: z.string().optional(), // optional final verdict or recommendation
});

export type StructuredReply = z.infer<typeof structuredReplySchema>;
