// 🔄 Deprecated — will be replaced by cliHelpText.js
export function printHelp() {
  console.log(`
📘 Dokugent CLI Help

Usage:
  dokugent scaffold <scope> [--force] [--backup] [--with-checklists]
  dokugent scaffold --custom=<folder>
  dokugent review [--plan] [--protocols <list>]
  dokugent certify --key <path>
  dokugent compile [--plan] [--protocols] [--prod] [--dev] [--llm=<agent>]

Commands:
  scaffold           Scaffold .dokugent folder based on scope (core, qa, addons, etc.)
  review             Validate .dokugent/plan.yaml or selected protocols for agent-readiness
  keygen             Generate a private/public RSA keypair for signing certifications
  certify            Sign review.md with private key and output tamper-checkable .cert
  compile            Compile reviewed plan or protocols into agent-ready files

Options:

  scaffold:
    --force                                   Overwrite existing files
    --backup                                  Create .bak backups before overwriting
    --custom=<folder>                         Create an empty folder inside .dokugent/ with the given name
    --custom=<folder> blueprint=<blueprint>   Create a custom folder with a specific blueprint

  review:
    --plan             Review and validate the plan.yaml file
    --protocols <list> Comma-separated protocol folders or "all"

  certify:
    --key <path>       Path to private key for certification

  compile:
    --plan                   Compile the reviewed plan into compiled-plan.md
    --protocols              Compile the reviewed protocols into compiled-protocols.md
    --verbose-tokens         Show token count estimate for compiled output
    --prod             Output to compiled/prod/
    --dev              Output to compiled/dev/
    --llm <agent>      Optional agent tag to name compiled file (e.g. codex)

  help:
    --help             Show this help message

Examples:
  dokugent scaffold core --with-checklists --backup
  dokugent scaffold --custom=ai-labs --blueprint=blank
  dokugent compile --plan --dev --llm=codex
  dokugent compile --protocols --prod --llm=claude
  dokugent compile --protocols --dev --llm=codex --verbose-tokens
  dokugent review --plan
  dokugent review --protocols=qa,ux
  dokugent keygen --name carmelyne@kinderbytes.com
  dokugent certify --key .dokugent/keys/id_doku_priv.pem

Learn more:
  🧠 Agent briefings use structured Doku Tags like @document_analysis to guide LLM behavior.
  💡 Docs + examples: https://github.com/carmelyne/dokugent-cli
`);
}