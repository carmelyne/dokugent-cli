# CODEX.md – Conventions for Codex Agents

These conventions are tailored to agents using OpenAI's Codex or instruction-tuned GPT-3.5 variants. Based on typical behavior patterns and community insights.

## Setup Conventions

- Explicitly define programming goals and coding constraints.
- Set language/framework context at the top of the prompt.
- Use natural language summaries before code blocks to provide intent.

## Tool Usage

- Works best when paired with file readers, doc analyzers, or linters.
- Can refactor, summarize, and document code effectively.
- Avoids hallucination if tool outputs are explicit and scoped.

## Prompting Patterns

- Short prompts with explicit tasks perform best (e.g., “Convert this JS code to Python”).
- Codex performs well with commented examples and `// explain` style lines.
- Avoid ambiguous tasks; use small, composable instructions.

## Review and Validation

- Enable a second agent or human review pass to validate output logic.
- Pair with unit test generation tools if writing functions or methods.
- Dryrun before certifying code suggestions to catch syntax issues.

## Feedback Loops

- Encourage agents to re-check assumptions (e.g., “Review your logic before finalizing”).
- Structure task breakdown into iterative stages (parse → plan → write → verify).

## Common Pitfalls to Avoid

- Tends to "complete" code without understanding intent—be directive.
- May overuse boilerplate if not scoped tightly.
- Doesn’t handle ambiguous syntax well without context.

## Integration Notes

- Works best with coding workflows where agents operate as assistive copilots.
- Behavior improves with inline comments and structured file inputs.

## Source

Based on OpenAI Codex community insights and GPT-3.5 instruction-tuned usage patterns.
