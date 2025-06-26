/**
 * @docLetter v0.1
 * @llmRole: Prompt Injector
 * @mood: Clear, Contextual, Supportive
 * @trustLevel: operational
 * @xoxoCreator: Pong 💚
 * @creatorNote: This utility formats CareTags into a readable prompt for LLMs. It ensures that role, tone, context, and critical constraints are included at runtime. It acts as a handshake between code and cognition.
 * @output: Stringified prompt instructions
 * @hardRules:
 * - Do not omit any required CareTags.
 * - Preserve the tone and intent of the original CareTags.
 */
type CareTagMap = Record<string, string | string[]>;

export function injectCareTagsIntoPrompt(careTags: CareTagMap): string {
  const lines: string[] = [];

  if (careTags.llmRole) {
    lines.push(`You are acting as: ${careTags.llmRole}`);
  }

  if (careTags.mood) {
    lines.push(`Adopt a tone that is: ${careTags.mood}`);
  }

  if (careTags.trustLevel) {
    lines.push(`Data sensitivity: ${careTags.trustLevel}`);
  }

  if (careTags.lastModified) {
    lines.push(`Last modified: ${careTags.lastModified}`);
  }

  if (careTags.deprecatedAfter) {
    lines.push(`Deprecated after: ${careTags.deprecatedAfter}`);
  }

  if (careTags.reviewer) {
    lines.push(`Reviewed by: ${careTags.reviewer}`);
  }

  if (careTags.stakeholder) {
    lines.push(`Stakeholder: ${careTags.stakeholder}`);
  }

  if (careTags.expectedRuntime) {
    lines.push(`Expected runtime: ${careTags.expectedRuntime}`);
  }

  if (careTags.dependencies) {
    lines.push(`Dependencies: ${careTags.dependencies}`);
  }

  if (careTags.creatorNote) {
    lines.push(`Note from creator: ${careTags.creatorNote}`);
  }

  if (careTags.output) {
    lines.push(`Your output should match: ${careTags.output}`);
  }

  if (careTags.hardRules && Array.isArray(careTags.hardRules)) {
    lines.push(`Hard refusal conditions:`);
    for (const rule of careTags.hardRules) {
      lines.push(`- ${rule}`);
    }
  }

  return lines.join('\n');
}

/**
 * LLM Response Log:
 * @respondedBy: GPT-4o
 * @timestamp: 2025-06-24T17:40:00Z
 * @interpretation: This function dynamically converts CareTags into a runtime prompt. Each tag is rendered into a natural-language directive, enabling LLMs to understand context, tone, trust, and output requirements without needing to parse the raw CareTag object directly.
 * @clarifications: None needed; function is direct and linear.
 * @concerns: As more CareTags are added, verbosity may increase—consider limits or priorities in future.
 * @suggestions: Add support for multi-line `creatorNote` formatting. Also consider distinguishing between human-facing vs LLM-facing prompts.
 * @moodResponse: I acknowledge the guiding tone of clarity and support. Confirming alignment and intention.
 * @context: This module operationalizes the CareTag layer into runtime guidance for LLMs.
 */
