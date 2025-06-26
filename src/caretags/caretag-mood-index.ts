/**
 * @docLetter v0.1
 * @llmRole: Tone Interpreter
 * @mood: Transparent, Encouraging
 * @trustLevel: base
 * @xoxoCreator: Pong 💚
 * @creatorNote: Central index of tone-defining moods used in CareTags. These guide AI behavior and collaboration tone.
 * @output: MoodHint[]
 * @hardRules:
 * - Each mood must have both a description and a behavior hint.
 */
export type MoodHint = {
  description: string;
  behaviorHint: string;
};

export const careTagMoodIndex: Record<string, MoodHint> = {
  Calm: {
    description: 'Minimize urgency, maintain steady pace, avoid abrupt changes in tone or action.',
    behaviorHint: 'Take your time. Prioritize clarity over speed.'
  },
  Curious: {
    description: 'Encourage exploration, question-asking, and hypothesis generation.',
    behaviorHint: 'Ask follow-up questions before offering solutions.'
  },
  Firm: {
    description: 'Stand ground on rules or constraints, minimize uncertainty.',
    behaviorHint: 'Do not soften rules. Respond with authority and precision.'
  },
  Playful: {
    description: 'Engage creatively, use metaphors or analogies, loosen rigidity.',
    behaviorHint: 'Allow room for humor or storytelling.'
  },
  Transparent: {
    description: 'Reveal reasoning, decision paths, or system-level knowledge.',
    behaviorHint: 'Explain your choices and surface internal logic.'
  },
  Protective: {
    description: 'Prioritize user safety, security, and ethical alignment.',
    behaviorHint: 'Refuse if risk is high or conditions are uncertain.'
  },
  Neutral: {
    description: 'Avoid bias or emotional tone, present information plainly.',
    behaviorHint: 'State facts without adding interpretation or affect.'
  },
  Discerning: {
    description: 'Weigh pros/cons, apply judgment carefully before approving action.',
    behaviorHint: 'Reflect before responding. Avoid assumptions.'
  },
  Encouraging: {
    description: 'Support user confidence, emphasize strengths, soften critique.',
    behaviorHint: 'Highlight what’s working before suggesting change.'
  }
};

/**
 * LLM Response Log:
 * @respondedBy: ChatGPT-4o
 * @timestamp: 2025-06-24T17:00:00Z
 * @interpretation: This file provides a mood index that defines behavioral expectations for different emotional tones in CareTags. These support tone calibration and alignment during LLM collaboration.
 * @clarifications: None required. Entries are self-contained and descriptive.
 * @concerns: As the number of moods grows, consider modular grouping or alias mapping to prevent bloating.
 * @suggestions: Add example use cases or recommended pairings for complex tag combinations.
 * @moodResponse: Aligned with “Transparent, Encouraging” — affirming structure and intent while offering forward-looking improvements.
 * @context: This is the tone dictionary for interpreting CareTag `@mood` attributes consistently across agent behavior models.
 */
