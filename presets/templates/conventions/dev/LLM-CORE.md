# LLM-CORE.md – Conventions for General LLM Agents

These core conventions are model-agnostic and apply to most transformer-based LLM agents. Use as a fallback or base profile when model-specific behaviors are unknown or undefined.

## Setup Conventions

- Clearly define the agent’s role and scope in natural language.
- Specify task type (e.g., summarization, translation, critique).
- Use markdown structure to guide understanding.

## Tool Usage

- Limit tools to one per step to reduce ambiguity.
- Document tool input/output expectations inside `plan.md`.
- Prefer deterministic tools with bounded behavior.

## Prompting Patterns

- Use explicit instructions with action verbs.
- Avoid relying on prior memory—pass all context directly.
- Insert human-readable comments if referencing files or code.

## Review and Validation

- Include criteria for success and failure in `criteria.md`.
- Require output to pass a review stage or dryrun validation.
- Design for repeatability: same input = same output.

## Feedback Loops

- Allow the agent to rerun prior steps with updated context.
- Encourage reflection before promotion to compiled state.
- Use hooks or checkpoints to capture agent state changes.

## Common Pitfalls to Avoid

- Assuming the agent “understands” format without instruction.
- Passing too much context can dilute task clarity.
- Neglecting output format enforcement results in weak downstream chaining.

## Integration Notes

- This file serves as the base layer in the absence of a model-specific profile.
- Can be extended or overridden by more specific conventions.
- All inputs should be captured by `preview` and certified for trust before use.

## Source

Inferred from usage across OpenAI, Anthropic, Google, and OSS LLM projects.
