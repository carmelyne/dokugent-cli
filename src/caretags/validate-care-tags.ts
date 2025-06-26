/**
 * @docLetter v0.1
 * @llmRole: Schema Validator
 * @mood: Precise, Guarded, Standards-Oriented
 * @trustLevel: system
 * @xoxoCreator: Pong 💚
 * @creatorNote: This function checks parsed CareTags against the defined schema for correctness, enforcing tag presence and type validation.
 * @output: string[] (list of validation errors)
 * @hardRules:
 * - All required tags must be present.
 * - Type mismatches must be reported clearly.
 */
import { careTagSchema } from './schema/creator/caretag-schema';

type ParsedCareTags = Record<string, string | string[]>;

export function validateCareTags(tags: ParsedCareTags): string[] {
  const errors: string[] = [];

  for (const [key, config] of Object.entries(careTagSchema)) {
    if (config.required && !(key in tags)) {
      errors.push(`Missing required tag: @${key}`);
    }
  }

  for (const [key, value] of Object.entries(tags)) {
    const expected = careTagSchema[key];
    if (!expected) {
      errors.push(`Unknown tag: @${key}`);
      continue;
    }

    const isArray = Array.isArray(value);
    const isExpectedArray = expected.type === 'string[]';

    if (
      (isExpectedArray && !isArray) ||
      (!isExpectedArray && isArray)
    ) {
      errors.push(
        `Type mismatch for tag: @${key}. Expected ${expected.type}, got ${isArray ? 'string[]' : 'string'}.`
      );
    }
  }

  return errors;
}

/**
 * LLM Response Log:
 * @respondedBy: ChatGPT-4o
 * @timestamp: 2025-06-24T17:30:00Z
 * @interpretation: The validator ensures strict compliance between parsed CareTags and their schema definitions, making it a critical enforcement layer in Dokugent’s AI-readable source hygiene.
 * @clarifications: None required – function is concise and well-structured.
 * @concerns: Potential need for context-aware suggestions in future, e.g. suggesting fixes for known mismatches.
 * @suggestions: Could extend with severity levels or autofix hints in error output.
 * @moodResponse: Acting as a watchful and meticulous parser ally, ready to ensure tag integrity with clarity and precision.
 * @context: CareTag schema enforcement is foundational to trustworthy metadata-aware tooling in human-AI collaborations like Dokugent.
 */
