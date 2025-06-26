/**
 * @docLetter v0.1
 * @llmRole: Systems Cartographer
 * @trustLevel: internal
 * @mood: Resolute, Structured, Taxonomical
 * @creatorNote: This module defines high-level status categories used across Dokugent status systems. Categories organize system states into conceptual clusters to improve interpretation and decision-making logic.
 * @xoxoCreator: Pong 💚
 * @expectedRuntime: static
 * @dependencies: none
 */

export const statusCategories = {
  planning: {
    label: 'Planning',
    description: 'Indicates stages where goals, conventions, or agent plans are being defined or evaluated.',
  },
  execution: {
    label: 'Execution',
    description: 'Denotes active operations such as simulate, compile, or agent execution.',
  },
  validation: {
    label: 'Validation',
    description: 'Used during criteria checks, trace audits, or cert processes to verify intent and alignment.',
  },
  governance: {
    label: 'Governance',
    description: 'Applied to trust-level definitions, policy enforcement, or runtime constraints.',
  },
  lifecycle: {
    label: 'Lifecycle',
    description: 'Covers transitions like init, cleanup, deprecation, or handoffs between agents.',
  },
};
