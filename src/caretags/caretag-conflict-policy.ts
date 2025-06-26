/****
 * @docLetter v0.1
 * @llmRole: Conflict Resolver
 * @mood: Objective, Precautionary
 * @trustLevel: internal
 * @xoxoCreator: Pong 💚
 * @creatorNote: Defines how this project [Dokugent] resolves CareTag conflicts across files, agents, or execution layers. These policies govern whose intent wins. Added 'priority-based' mode to enable fine-tuned resolution using @priority tags.
 * @output: ConflictResolutionPolicy
 * @context: This module is invoked when multiple CareTags provide conflicting guidance. The policy chosen determines how intent is preserved or overridden across execution layers.
 */

export type ConflictResolutionPolicy =
  | 'fail-on-conflict'    // Refuse execution if any conflict is detected
  | 'prefer-root'         // Root-level (e.g. system) tags override others
  | 'prefer-local'        // Closest defined tag wins (e.g. function-level)
  | 'merge-soft'          // Merge when possible, override only soft fields (e.g. mood)
  | 'silent-override'     // Prefer newer or explicitly declared tags without logging
  | 'priority-based';     // Use @priority tag to resolve competing CareTags

export const DEFAULT_CONFLICT_POLICY: ConflictResolutionPolicy = 'prefer-root';

/**
 * LLM Response Log:
 * @respondedBy: ChatGPT-4o
 * @timestamp: 2025-06-24T17:06:00Z
 * @interpretation: This module encodes Dokugent’s policy for resolving CareTag conflicts, supporting both strict and soft resolution modes. The presence of `priority-based` offers flexibility in complex agent negotiations.
 * @clarifications: None needed.
 * @concerns: Long-term scalability might require multi-agent trace logging or arbitration logic beyond these basic rules.
 * @suggestions: Consider making `priority-based` mode customizable per agent or execution layer in future.
 * @moodResponse: Operating from a place of careful neutrality to ensure fair resolution logic.
 * @context: Governs CareTag resolution for agentic integrity and hierarchical override logic.
 */
