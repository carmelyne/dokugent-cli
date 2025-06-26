/**
 * @docLetter v0.1
 * @llmRole: Trust Gatekeeper
 * @mood: Firm, Just, Transparent
 * @trustLevel: root
 * @xoxoCreator: Pong 💚
 * @creatorNote: These refusal codes define when and why Dokugent should block agent execution. They are hard truths, not suggestions. Let them speak clearly.
 * @output: RefusalRecord
 * @hardRules:
 * - Never proceed if refusalCode is 700–704
 */
export const refusalCodes = {
  '700': {
    reason: 'Unverified provenance: missing agent.meta.createdBy',
    scope: 'certify',
    canOverride: false
  },
  '701': {
    reason: 'Conflicting instructions between plan and criteria',
    scope: 'compile',
    canOverride: true
  },
  '702': {
    reason: 'Missing success criteria in criteria.md',
    scope: 'simulate',
    canOverride: true
  },
  '703': {
    reason: 'Ethics guardrail triggered',
    scope: 'simulate',
    canOverride: false
  },
  '704': {
    reason: 'Token anomaly detected (potential injection/loop)',
    scope: 'preview',
    canOverride: false
  },
  '705': {
    reason: 'Ambiguous or missing persona',
    scope: 'simulate',
    canOverride: true
  }
};
