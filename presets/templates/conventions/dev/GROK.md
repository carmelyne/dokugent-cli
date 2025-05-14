# GPT4.md – Conventions for GPT-4 Agents

These conventions are designed for agents powered by OpenAI’s GPT-4 model. They reflect known behaviors from production usage and best practices for instruction tuning.

## Setup Conventions

- Define the agent’s task with precision, including role, goal, and step.
- Provide contextual scaffolding using frontmatter or structured markdown.
- Indicate any memory or token constraints early in the prompt.

## Tool Usage

- GPT-4 handles multi-step reasoning well—assign tools for decomposition.
- Supports parallel tool outputs merged into coherent summaries.
- Ideal for summarizers, QA chains, editors, and reviewers.

## Prompting Patterns

- Chain-of-thought style prompts improve accuracy.
- Use “You are...” framing with persona alignment.
- Include example inputs/outputs when applicable.

## Review and Validation

- GPT-4 benefits from self-verification (e.g., “Review your own answer...”).
- Dryrun workflows can simulate agent output without real-time inference.
- Criteria-driven prompts help enforce structured correctness.

## Feedback Loops

- Effective when allowed to revise based on feedback or failed output.
- Can reflect on earlier steps to adjust tone, content, or logic.
- Enable peer agent comparisons to surface the best output.

## Common Pitfalls to Avoid

- May overrespond or repeat instructions without constraints.
- Prone to verbosity—require concise output formatting.
- Doesn’t inherently prioritize critical instructions—highlight them clearly.

## Integration Notes

- Use YAML/MD scaffolding for human prep, preview JSON for LLM ingestion.
- Align GPT-4's role closely to human-authored plan and criteria files.
- Sensitive to small prompt wording shifts—keep consistent phrasing.

## Source

Drawn from OpenAI usage guides, developer experience reports, and multi-agent benchmark studies.
