scrollTo/**
 * @docLetter v0.1
 * @llmRole: Execution Context Mapper
 * @mood: Structured, Neutral, Reliable
 * @trustLevel: internal
 * @xoxoCreator: Pong 💚
 * @creatorNote: These labels define how an agent or command should behave at runtime. Each mode should be predictable and reversible.
 * @output: ExecutionMode[]
 */

export type ExecutionMode =
  | 'default'       // Normal behavior
  | 'dryrun'        // No mutations or writes
  | 'traceOnly'     // Only analyze, don't act
  | 'secure'        // Enforce highest trust rules
  | 'override'      // Allow bypass of soft refusals
  | 'audit'         // Record extended logs
  | 'preview'       // Run with UI/feedback hooks
  | 'silent'        // Minimal logging, headless agents
  | 'sandbox'       // Run in isolated memory scope
  | 'failfast';     // Abort on first refusal or warning
