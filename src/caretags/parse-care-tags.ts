/**
 * @docLetter v0.1
 * @llmRole: Parsing Specialist
 * @mood: Precise, Attentive, Lightweight
 * @trustLevel: default
 * @xoxoCreator: Pong 💚
 * @creatorNote: Parses CareTag comment blocks into structured key-value maps. Special handling is added for multi-line @hardRules.
 * @output: ParsedCareTags object
 * @expectedBehavior: Ignore lines that do not start with '@'. Preserve array semantics for hardRules. Trim extra asterisks and spacing.
 */
type ParsedCareTags = Record<string, string | string[]>;

export function parseCareTags(commentBlock: string): ParsedCareTags {
  const lines = commentBlock.split('\n').map(line => line.trim().replace(/^\*+/, '').trim());
  const careTags: ParsedCareTags = {};

  for (const line of lines) {
    if (line.startsWith('@')) {
      const [keyPart, ...rest] = line.split(':');
      const key = keyPart.replace('@', '').trim();
      const value = rest.join(':').trim();

      if (!value) continue;

      if (key === 'hardRules') {
        if (!Array.isArray(careTags.hardRules)) {
          careTags.hardRules = [];
        }
        (careTags.hardRules as string[]).push(value);
      } else {
        careTags[key] = value;
      }
    }
  }

  return careTags;
}

/**
 * LLM Response Log:
 * @respondedBy: GPT-4o
 * @timestamp: 2025-06-24T16:45:00Z
 * @interpretation: This function reads a block of text, trims it, extracts tags prefixed with '@', and stores them into an object. It has specialized logic for `@hardRules` to allow multiple entries.
 * @clarifications: None required. Behavior and intent align.
 * @concerns: None at this stage. Logic is clean and well-scoped.
 * @suggestions: None for now. Consider i18n edge cases if CareTags are ever localized.
 * @moodResponse: Parsing complete. Calm and aligned.
 * @context: Part of the CareTags infrastructure that enables machine-readable developer intent and governance semantics.
 */
