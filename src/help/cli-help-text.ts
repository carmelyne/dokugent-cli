


export function printInitHelp() {
  console.log(`
📦 dokugent init

Initialize a new Dokugent project in your current directory.

Usage:
  dokugent init

Creates the base .dokugent/ folder structure:
  ├── audit       → Signature logs and trace evidence
  ├── data        → Editable input: agent, plans, tools, rules
  ├── ops         → Output folders: preview, compiled, certified agents
  └── overrides   → Local dev overrides like whitelists

Notes:
  This command is interactive and currently in alpha.
  Use it to begin your agent design process.
`);
}

export function printAgentHelp() {
  console.log(`
🧠 dokugent agent

Create a new agent identity (interactive or template mode).

Usage:
  dokugent agent              → Launches interactive agent wizard
  dokugent agent --t          → Generates a sample agent identity you can edit

Generated agent metadata includes:
  - name, description
  - roles
  - contentTypes
  - task
  - owner and ownerId

Notes:
  If you change the "name" in the file, rename the folder to match before continuing with:
  dokugent plan --agent <agent-slug>
`);
}
