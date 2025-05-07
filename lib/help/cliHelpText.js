// Purpose: CLI help descriptions for Dokugent commands
export const cliHelpText = {
  init: {
    summary: 'Start a new agent project',
    usage: 'dokugent init',
    description: 'Creates the folder structure and starter files for a Dokugent project. Offers to launch the interactive wizard after setup.',
    flags: {}
  },
  plan: {
    summary: 'Create or update plan.md and plan.yaml',
    usage: 'dokugent plan [--force]',
    description: 'Creates both the human-readable plan.md and machine-readable plan.yaml. Use --force to overwrite if files exist.',
    flags: {
      '--force': 'Overwrite plan files if they already exist (backup will be created)'
    }
  },
  conventions: {
    summary: 'Manage and validate expected behaviors',
    usage: 'dokugent conventions [--new | --from=<file>]',
    description: 'Defines the behavior expectations an agent must follow. Can be reused across multiple plans.',
    flags: {
      '--new': 'Create a new conventions file',
      '--from=<file>': 'Import conventions from another agent or template'
    }
  },
  criteria: {
    summary: 'Define evaluation checks or QA steps',
    usage: 'dokugent criteria [--new | --from=<file>]',
    description: 'Outlines how an agent’s behavior will be reviewed or scored. Typically includes acceptance criteria or red lines.',
    flags: {
      '--new': 'Create a new criteria file',
      '--from=<file>': 'Start from an existing QA ruleset'
    }
  },
  preview: {
    summary: 'Preview plan, conventions, and criteria before compiling',
    usage: 'dokugent preview --plan --conventions --criteria',
    description: 'Renders human-readable summaries of planning docs before compiling into a spec.',
    flags: {
      '--plan': 'Path to the plan file',
      '--conventions': 'Path to the conventions file',
      '--criteria': 'Path to the criteria file'
    }
  },
  compile: {
    summary: 'Prepare a usable spec (for Claude, GPT, etc.)',
    usage: 'dokugent compile --plan --conventions [--criteria] [--llm=<provider>]',
    description: 'Turns your plan + conventions + criteria into an LLM-friendly Markdown spec.',
    flags: {
      '--plan': 'Path to the plan file',
      '--conventions': 'Path to the conventions file',
      '--criteria': 'Optional path to evaluation rules',
      '--llm=<provider>': 'Target LLM format (gpt, claude, etc.)',
      '--prod': 'Compile with optimizations for production',
      '--dev': 'Compile with debug-friendly formatting',
      '--verbose-tokens': 'Show token-level diagnostics (dev only)'
    }
  },
  trace: {
    summary: 'Capture detailed agent execution history',
    usage: 'dokugent trace --capture --output=<file>',
    description: 'Records step-by-step logs of what the agent did and why. Ideal for audits and behavioral debugging.',
    flags: {
      '--capture': 'Enable tracing mode',
      '--format=<json|md>': 'Choose log output format',
      '--output=<file>': 'Specify file path for log output'
    }
  },
  security: {
    summary: 'Validate against unsafe actions, tools, or behavior',
    usage: 'dokugent security --deny-list [--require-approvals]',
    description: 'Enforces safety constraints like banned actions or required approvals for risky operations.',
    flags: {
      '--deny-list': 'Use a deny-list of unsafe patterns or tools',
      '--require-approvals': 'Enable human-in-the-loop for high-risk steps'
    }
  },
  dryrun: {
    summary: 'Preview execution plan without running any actions',
    usage: 'dokugent dryrun --plan --conventions --criteria [--step=<id>]',
    description: 'Simulates the plan without calling tools or committing output. Great for debugging logic.',
    flags: {
      '--plan': 'Path to the plan file',
      '--conventions': 'Path to the conventions file',
      '--criteria': 'Path to the criteria file',
      '--step=<id>': 'Optional: isolate and test one step',
      '--with-debug': 'Include trace-level commentary in the output'
    }
  },
  simulate: {
    summary: 'Execute plan in interactive sandbox environment',
    usage: 'dokugent simulate --plan --conventions --criteria [--step=<id>]',
    description: 'Runs the agent plan as if live, but in a controlled sandbox. Useful for walkthroughs or previews.',
    flags: {
      '--plan': 'Path to the plan file',
      '--conventions': 'Path to the conventions file',
      '--criteria': 'Path to the criteria file',
      '--step=<id>': 'Run or replay a specific step',
      '--with-debug': 'Enable verbose simulation logs'
    }
  },
  keygen: {
    summary: 'Generate a private/public key pair for signing',
    usage: 'dokugent keygen --name=<id>',
    description: 'Creates cryptographic keys for use in Dokugent certification workflows.',
    flags: {
      '--name=<id>': 'Name or label for the generated key pair'
    }
  },
  certify: {
    summary: 'Sign a plan or protocol with a private key',
    usage: 'dokugent certify --key=<path> --name=<id>',
    description: 'Adds a cryptographic signature to a compiled plan or protocol to certify authenticity.',
    flags: {
      '--key=<path>': 'Path to your private key file',
      '--name=<id>': 'Name of the plan or protocol being certified'
    }
  },
  review: {
    summary: 'Review execution trace for QA',
    usage: 'dokugent review --from=<trace>',
    description: 'Allows post-trace evaluation of agent output including human comments and approval.',
    flags: {
      '--from=<trace>': 'Path to the trace file',
      '--comment': 'Add review comments',
      '--approve': 'Mark trace as approved'
    }
  },
  wizard: {
    summary: 'Interactive agent and project configurator',
    usage: 'dokugent wizard',
    description: 'Launches an interactive prompt to define your agent type, tools, goals, and preferred LLM. Populates PROJECTS.md and agent-tools/ with your selections.',
    flags: {}
  }
};