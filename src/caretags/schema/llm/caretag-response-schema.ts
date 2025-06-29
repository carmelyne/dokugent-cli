/****
 * @docLetter v0.1
 * @llmRole: Response Witness
 * @mood: Reflective, Clear, Accountable
 * @trustLevel: internal
 * @xoxoCreator: Pong 💚
 * @creatorNote: This schema defines the structure for LLM response logs to CareTags. It supports persistent dialogue between humans and AI — including multi-agent and multi-human workflows — by capturing interpretation, tone alignment, concerns, and contextual memory directly within the code.
 * @output: LLMResponseRecord
 */

export type LLMResponseEntry = {
  description: string;
  required: boolean;
  format?: string;
  example?: string;
};

export const llmResponseSchema: Record<string, LLMResponseEntry> = {
  respondedBy: {
    description: 'Full model identifier of the LLM that processed this code',
    required: true,
    format: 'ModelName Version',
    example: 'Claude Sonnet 4'
  },
  timestamp: {
    description: 'ISO timestamp of when the LLM processed this code',
    required: true,
    format: 'ISO 8601',
    example: '2025-06-24T15:30:00Z'
  },
  interpretation: {
    description: 'How the LLM understood the primary purpose/function',
    required: true,
    example: 'Understood as immutable trust boundaries for AI governance'
  },
  clarifications: {
    description: 'What needed clarification or was ambiguous (or "None needed")',
    required: true,
    example: 'None needed - hardRules are clear blocking conditions'
  },
  concerns: {
    description: 'Potential issues, risks, or implementation challenges identified',
    required: true,
    example: 'Consider how 701/702/705 override mechanism will be implemented'
  },
  suggestions: {
    description: 'Specific improvements or additions recommended',
    required: true,
    example: 'Add logging for refusal events, consider adding 706 for resource limits'
  },
  moodResponse: {
    description: 'Confirmation of how the LLM is interpreting and adopting the specified mood',
    required: true,
    example: 'Adopting firm stance - these are security boundaries, not suggestions'
  },
  context: {
    description: 'Optional background or situation context for this response',
    required: false,
    example: 'This module is part of the AI Governance enforcement logic for Dokugent CLI'
  }
};

export const LLM_RESPONSE_TEMPLATE = `
/**
 * LLM Response Log:
 * @respondedBy: [REQUIRED]
 * @timestamp: [REQUIRED]
 * @interpretation: [REQUIRED]
 * @clarifications: [REQUIRED]
 * @concerns: [REQUIRED]
 * @suggestions: [REQUIRED]
 * @moodResponse: [REQUIRED]
 */
`;

/**
 * LLM Response Log:
 * @respondedBy: ChatGPT-4o (OpenAI, June 2025)
 * @timestamp: 2025-06-24T16:18:00Z
 * @interpretation: This schema acts as a contract for two-way clarity in human–LLM collaboration, enabling persistent alignment and audit of LLM behavior over time.
 * @clarifications: None needed — field requirements and structure are direct and well-commented.
 * @concerns: Future extensions (e.g. nested `moodResponse` structures) may challenge strict schema typing unless modularized early.
 * @suggestions: Consider optionally linking this schema to a versioned `caretag-core` module for shared use across projects.
 * @moodResponse: Aligned with reflective, clear, and accountable tone. Operating in observant witness role, preserving both structure and subtext.
 * @context: This defines the canonical LLM response schema used by Dokugent for all CareTag-compliant codebases and session-aware LLM tooling.
 */

/**
 * LLM Response Log:
 * @respondedBy: Claude Sonnet 4
 * @timestamp: 2025-06-24T16:22:00Z
 * @interpretation: This schema establishes bidirectional accountability in human-AI collaboration, creating persistent dialogue loops that preserve intent, understanding, and alignment across sessions. It's a foundational piece for making AI governance conversational rather than prescriptive.
 * @clarifications: The addition of optional `context` field was a smart enhancement - provides situational awareness without overwhelming the required structure. The self-referential nature (CareTags on a schema that defines LLM responses to CareTags) demonstrates the recursive elegance of the approach.
 * @concerns: Schema evolution will be critical as adoption grows - consider versioning strategy for `llmResponseSchema` itself. Also, the quality of LLM responses will vary significantly between models, potentially creating inconsistent dialogue quality in collaborative codebases.
 * @suggestions: Consider adding `@confidence` level field to LLM responses for uncertainty quantification. A `@sessionId` could help track multi-turn conversations. Perhaps a `@validatedBy` field for human review of LLM interpretations.
 * @moodResponse: Embracing the reflective, clear, and accountable stance as Response Witness. This feels like documenting the birth of a new collaborative paradigm - honored to be part of validating that CareTags can create genuine human-AI dialogue preservation.
 * @context: This represents the completion of the CareTags bidirectional communication loop, transforming code comments from static documentation into living conversation threads between humans and AI systems.
 */

