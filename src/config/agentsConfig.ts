// agentsConfig.ts
// Agent registry metadata for Dokugent

export const agentsConfig = {
  claude: {
    label: "Claude 3",
    maxTokenLoad: 100000,
    idealBriefingSize: 8000,
    notes: "Claude handles large contexts well but prefers well-structured, flat markdown with minimal recursion.",
  },
  codex: {
    label: "Codex CLI",
    maxTokenLoad: 4000,
    idealBriefingSize: 2000,
    notes: "Codex prefers short code-oriented prompts. Strip prose-heavy files.",
  },
  gpt4: {
    label: "GPT-4 Turbo",
    maxTokenLoad: 128000,
    idealBriefingSize: 12000,
    notes: "GPT-4 handles large input but may hallucinate under bloat. Focus on clarity over quantity.",
  },
  gemini: {
    label: "Gemini",
    defaultVariant: "pro-1.5",
    variants: {
      "pro-1.5": {
        label: "Gemini 1.5 Pro",
        maxTokenLoad: 2097152,
        idealBriefingSize: 12000,
        notes: "Optimized for long-context reasoning. Keep prompts structured.",
      },
      "flash-1.5": {
        label: "Gemini 1.5 Flash",
        maxTokenLoad: 1048576,
        idealBriefingSize: 8000,
        notes: "Prioritizes speed. Avoid verbose instructions.",
      },
      "pro-2.5": {
        label: "Gemini 2.5 Pro",
        maxTokenLoad: 1048576,
        idealBriefingSize: 16000,
        notes: "Enhanced output length. Use for summarization or report generation.",
      },
    },
  },
  llama: {
    label: "LLaMA 3",
    maxTokenLoad: 32000,
    idealBriefingSize: 6000,
    notes: "Ideal for compact reasoning tasks. Strip all non-essential markdown decoration.",
  },
  mistral: {
    label: "Mistral",
    defaultVariant: "7b",
    variants: {
      "7b": {
        label: "Mistral 7B",
        maxTokenLoad: 32000,
        idealBriefingSize: 6000,
        notes: "Good for lightweight tasks and tight loops. Focuses on speed and efficiency.",
      },
    },
  },
  mixtral: {
    label: "Mixtral 8x7B",
    maxTokenLoad: 32000,
    idealBriefingSize: 8000,
    notes: "Better at diverse prompt styles. Use when tasks vary or need a broader reasoning range.",
  },
  grok: {
    label: "xAI Grok",
    maxTokenLoad: 128000,
    idealBriefingSize: 8000,
    notes: "Grok is designed for contextual understanding and fast iteration. Structured Markdown helps, but it can handle natural language prompts well. Context limits and variant distinctions may evolve as the API matures.",
  },
} as const;
