export function printHelp() {
  console.log(`
📘 Dokugent CLI Help

Usage:
  dokugent scaffold <scope> [--force] [--backup] [--with-checklists]
  dokugent compile --llm=<codex|claude>

Commands:
  scaffold           Scaffold .dokugent folder based on scope (core, qa, addons, etc.)
  compile            Compile an agent briefing from .dokugent/ files

Options:
  --force            Overwrite existing files
  --backup           Create .bak backups before overwriting
  --with-checklists  Include checklist-enhanced templates
  --help             Show this help message

Examples:
  dokugent scaffold core --with-checklists --backup
  dokugent compile --llm=codex

Learn more:
  🧠 Agent briefings use structured Doku Tags like @document_analysis to guide LLM behavior.
  💡 Docs + examples: https://github.com/carmelyne/dokugent-cli
`);
}