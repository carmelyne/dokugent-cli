// Purpose: Centralized definition of all CLI flags used in Dokugent CLI
export const cliSpec = {
  commands: {
    init: {
      description: 'Start a new agent project',
      flags: ['--force']
    },
    wizard: {
      description: 'Interactive agent and project configurator',
      flags: []
    },
    plan: {
      description: 'Create or update plan.md and plan.yaml',
      flags: ['--force']
    },
    conventions: {
      description: 'Copy conventions templates into the project folder',
      flags: ['--force']
    },
    criteria: {
      description: 'Create or update criteria.md and criteria.yaml',
      flags: ['--force']
    },
    preview: {
      description: 'Render plan, conventions, and criteria for human review before compiling',
      flags: ['--agent=<key>', '--variant=<key>']
    },
    security: {
      description: 'Validate against unsafe actions, tools, or behavior',
      flags: ['--deny-list', '--require-approvals']
    },
    certify: {
      description: 'Sign a plan or protocol with a private key',
      flags: ['--key=<path>', '--name=<id>']
    },
    compile: {
      description: 'Prepare a usable spec (for Claude, GPT, etc.)',
      flags: ['--plan', '--conventions', '--criteria', '--llm=<provider>', '--prod', '--dev', '--verbose-tokens']
    },
    dryrun: {
      description: 'Preview execution plan without running any actions',
      flags: ['--plan', '--conventions', '--criteria', '--step=<id>', '--with-debug']
    },
    simulate: {
      description: 'Execute plan in interactive sandbox environment',
      flags: ['--plan', '--conventions', '--criteria', '--step=<id>', '--with-debug']
    },
    trace: {
      description: 'Capture detailed agent execution history',
      flags: ['--capture', '--format=<json|md>', '--output=<file>']
    },
    review: {
      description: 'Post-trace QA review of compiled output and execution behavior',
      flags: ['--from=<trace>', '--comment', '--approve']
    },
    keygen: {
      description: 'Generate a private/public key pair for signing',
      flags: ['--name=<id>']
    },
    fetch: {
      description: 'Download community-contributed plan, convention, or tool templates',
      flags: []
    }
  }
};
