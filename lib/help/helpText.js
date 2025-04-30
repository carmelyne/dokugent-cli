export function printHelp() {
  console.log(`
📘 Dokugent CLI Help

Usage:
  dokugent scaffold <scope> [--force] [--backup] [--with-checklists]
  dokugent scaffold --custom=<folder>
  dokugent compile --llm=<codex|claude>
  dokugent stage [--scope <folder>] [--protocols <list>]
  dokugent certify --key <path>

Commands:
  scaffold           Scaffold .dokugent folder based on scope (core, qa, addons, etc.)
  stage              Generate a staging review.md from .dokugent protocols
  keygen             Generate a private/public RSA keypair for signing certifications
  certify            Sign review.md with private key and output tamper-checkable .cert
  compile            Compile an agent briefing from .dokugent/ files

Options:

  scaffold:
    --force            Overwrite existing files
    --backup           Create .bak backups before overwriting
    --with-checklists  Include checklist-enhanced templates
    --custom=<folder>  Create an empty folder inside .dokugent/ with the given name

  stage:
    --scope <folder>   Target folder to stage (defaults to .dokugent)
    --protocols <list> Comma-separated protocol folders or "all"

  certify:
    --key <path>       Path to private key for certification

  compile:
    --llm <agent>      Agent to compile briefing for
    --prod             Enforce SHA + signature verification from review.cert
    --dev              Compile from llm-load.yml (for isolated dev testing)

  help:
    --help             Show this help message

Examples:
  dokugent scaffold core --with-checklists --backup
  dokugent scaffold --custom=ai-labs --blueprint=blank
  dokugent compile --llm=codex
  dokugent stage --protocols=all
  dokugent stage --protocols=qa,ux
  dokugent keygen --name carmelyne@kinderbytes.com
  dokugent certify --key .dokugent/keys/id_doku_priv.pem
  dokugent compile --llm=codex --prod
  dokugent compile --llm=codex --dev

Learn more:
  🧠 Agent briefings use structured Doku Tags like @document_analysis to guide LLM behavior.
  💡 Docs + examples: https://github.com/carmelyne/dokugent-cli
`);
}