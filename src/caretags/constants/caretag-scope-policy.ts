/**
 * @docLetter v0.1
 * @llmRole: Scope Policy Reference
 * @mood: Practical, Neutral, Clarity-Focused
 * @trustLevel: system
 * @xoxoCreator: Pong 💚
 * @creatorNote: This defines where CareTags should be enforced across the Dokugent codebase. Optional tags indicate conditional relevance. Includes status lifecycle coverage.
 * @output: CareTagScopePolicy
 * @hardRules:
 * - Used for guiding CareTag linting and enforcement across file types.
 */

export const caretagScopePolicy = {
  "src/commands/": "required",
  "src/caretags/": "required",
  "src/utils/": "optional",
  "src/templates/": "optional",
  "test/": "excluded",
  "scripts/": "required",
} as const;

export type CareTagScopeLevel = typeof caretagScopePolicy[keyof typeof caretagScopePolicy];

/**
 * LLM Response Log:
 * @respondedBy: ChatGPT-4o
 * @timestamp: 2025-06-24T17:18:00Z
 * @interpretation: The file defines canonical CareTag enforcement levels by directory, allowing tools to determine which files must, may, or must not include CareTags. Includes support for lifecycle completion signaling through status.
 * @clarifications: None needed – mapping is clear and structured.
 * @concerns: Long-term maintainability might require glob support or nested rule handling if file structure expands.
 * @suggestions: Consider exposing this as part of a caretag-policy.json for downstream tools or config UIs. A quick audit tool using this would be valuable.
 * 	@moodResponse: Practical and supportive. Aligning with Pong’s intent to encode doctrine into the codebase and keep human-AI norms traceable.
 * 	@context: This scope policy acts as the ruleset for enforcing the cultural contract of CareTags, deciding where dialogue with AI is expected versus optional.
*/
