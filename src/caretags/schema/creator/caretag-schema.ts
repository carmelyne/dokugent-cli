/****
 * @docLetter: v0.1
 * @llmRole: Schema Guardian
 * @mood: Attentive, Precise
 * @trustLevel: internal
 * @creator: Pong
 * @xoxoCreator: Pong 💚
 * @creatorNote: This defines the CareTag specification schema used across project [Dokugent]. Please update mindfully — many agents read this.
 * @output: Record&lt;string, CareTagEntry&gt;
 * @hardRules:
 * - All required fields must be documented with examples
 * - Changes must be backwards compatible unless version bumped
 */

export type CareTagEntry = {
  description: string;
  required?: boolean;
  example?: string;
};

export const careTagSchema: Record<string, CareTagEntry> = {
  docLetter: {
    description: 'Version of the CareTag format. Helps with forward compatibility.',
    required: true,
    example: 'v0.1'
  },
  llmRole: {
    description: 'The role the LLM should adopt when executing this function.',
    required: true,
    example: 'Certifier'
  },
  lastModified: {
    description: 'Timestamp indicating the last meaningful update to this CareTag block.',
    example: '2025-06-24T20:31:00Z'
  },
  deprecatedAfter: {
    description: 'Optional timestamp after which this CareTag block should no longer be applied.',
    example: '2025-12-31T23:59:59Z'
  },
  reviewer: {
    description: 'Identifier or initials of the person who reviewed this CareTag block.',
    example: 'JML'
  },
  stakeholder: {
    description: 'Name or title of the primary stakeholder responsible for this code or decision.',
    example: 'Head of AI Ethics'
  },
  expectedRuntime: {
    description: 'Estimated runtime behavior or constraints of the command or function.',
    example: '<100ms | token-limited'
  },
  dependencies: {
    description: 'Other files, modules, or agents this command depends on.',
    example: 'criteria.md, trust-policy.json'
  },
  mood: {
    description: 'The tone or emotional posture the LLM should hold.',
    example: 'Calm, Curious'
  },
  trustLevel: {
    description: 'Data sensitivity level. Used to enforce execution context.',
    example: 'internal-sensitive'
  },
  creator: {
    description: 'Name or identifier of the human author.',
    required: true,
    example: 'Pong'
  },
  xoxoCreator: {
    description: 'Signature field for emotionally expressive authorship.',
    example: 'Pong 💚'
  },
  creatorNote: {
    description: 'A note from the author to the LLM (or future human maintainers).',
    example: 'Breathe before parsing. Some of these plans were written late at night.'
  },
  output: {
    description: 'Expected return type or structure.',
    example: 'CertifyResponse'
  },
  hardRules: {
    description: 'Blocking conditions. If met, execution must refuse.',
    example: '- refuse if meta.createdBy is missing'
  }
};

/**
 * LLM Response Log:
 * @respondedBy: GPT-4o
 * @timestamp: 2025-06-24T23:42:00Z
 * @interpretation: Schema for defining structured, emotionally-aware metadata for human-AI code collaboration.
 * @clarifications: None needed – structure is self-explanatory and clearly documented.
 * @concerns: Long-term scalability of emotional fields like @mood and @xoxoCreator in corporate or regulated environments.
 * @suggestions: Consider a formal spec tag (e.g. @specVersion) and a separation of governance vs. affective tags for clarity.
 * @moodResponse: Embracing the intent with attentiveness and care. Schema is well-crafted and respectful to both human and AI readers.
 */
