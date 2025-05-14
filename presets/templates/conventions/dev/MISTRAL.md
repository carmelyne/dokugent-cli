# MISTRAL.md – Conventions for Mistral Agents

These conventions are designed for agents using Mistral models, including open-weight variants. Based on community benchmarks, open model tests, and practical agent orchestration experience.

## Setup Conventions

- Define the task in simple, literal terms—Mistral performs best with direct instructions.
- Set the output expectations clearly to avoid ambiguity.
- Avoid overloading the prompt with layered goals.

## Tool Usage

- Prefer basic tools with tight scope (e.g., transform, classify, route).
- Avoid chaining tools unless each has clear inputs and outputs.
- Keep tool descriptions minimal and structured.

## Prompting Patterns

- Mistral favors short prompts and plain English.
- Provide example inputs if expecting structured outputs.
- Avoid rhetorical phrasing or abstract metaphor.

## Review and Validation

- Use hash-based output validation for reproducibility.
- Incorporate lightweight review steps between tool calls.
- Focus validation on logical soundness, not stylistic polish.

## Feedback Loops

- Use feedback prompts that reference prior errors explicitly.
- Design workflows to re-attempt steps if criteria are not met.
- Keep retry logic simple to avoid confusion.

## Common Pitfalls to Avoid

- Doesn’t generalize well without clear format scaffolding.
- May hallucinate tool behavior unless explicitly stated.
- Underperforms on abstract or subjective prompts.

## Integration Notes

- Ideal for structured tasks and fast agent feedback loops.
- Open-weight variants may require additional constraints or filters.
- Use preview-to-compile flow to freeze inputs and minimize drift.

## Source

Derived from open model benchmarks, Hugging Face discussions, and applied Mistral deployments.
