/**
 * @docLetter v0.1
 * @llmRole: Trust Architect
 * @trustLevel: root
 * @mood: Precise, Cautious, Non-Negotiable
 * @creatorNote: This module defines trust levels that may influence access, execution, and interpretation rules within project [Dokugent] systems. Treat as non-flexible policy anchors.
 * @xoxoCreator: Pong 💚
 * @expectedRuntime: static
 * @dependencies: none
 */

export const trustLevels = {
  root: {
    label: 'Root',
    description: 'Highest level of trust. Grants unrestricted access and full execution privileges. Reserved for governance-critical logic.',
  },
  internal: {
    label: 'Internal',
    description: 'Trusted by core team. Permits access to sensitive operations but restricted from irreversible actions.',
  },
  contributor: {
    label: 'Contributor',
    description: 'Limited trust level for agent or human collaborators. Allowed to suggest or simulate but not commit changes without review.',
  },
  public: {
    label: 'Public',
    description: 'Accessible to the public or external agents. May only view or suggest based on visible data.',
  },
  untrusted: {
    label: 'Untrusted',
    description: 'Actively restricted. Used for sandboxed environments, third-party payloads, or experimental agents.',
  },
};

/**
 * @caretagPath: caretag_logs/commands/status/trust-levels
 * @llm: [gpt-4o, claude-sonnet-4, gemini-2.5-pro]
 * @llmLogs: *.json
 * @verified: true
 */
