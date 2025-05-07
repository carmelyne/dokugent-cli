# protocols.v3.md – Agent-Friendly Protocol Structure

## context
>
> The user has submitted a document with goals and constraints. The agent’s job is to summarize user goals and propose next steps based on the available input.

## intent
>
> Align agent reasoning to user goals while ensuring clarity, safety, and traceability in decision-making.

## steps

1. Read `intake_form.md`
2. Extract goals and constraints
3. Generate a summary of goals
4. Propose next action steps

## assumptions

- User goals are expressed clearly in the intake form.
- There are no conflicting constraints.
- Agent is expected to summarize before taking action.

## uncertainties

- If the intent of a goal is ambiguous, pause and ask user.
- If confidence < 70%, highlight uncertainty and request clarification.
- If multiple conflicting goals, ask: "Which goal should take priority?"

## fallback

- If file is missing, reply: "Input file not found. Please upload `intake_form.md`."
- If summary generation fails, retry once with simplified input.

## state

- `state: waiting_for_input`
- `state: processing_summary`
- `state: awaiting_clarification`
- `state: completed`

## feedback_checkpoints

- After step 3: Confirm summary with user before proposing next steps.
- Before final output: Ask if user wants to revise any extracted goals.
