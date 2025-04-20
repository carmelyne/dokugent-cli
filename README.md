# Docugent CLI

*Alpha release – under active development*

## 🧬 About

AI agents need more than raw code—they need context, structure, and guidance.

**Docugent** was built to solve that. It’s a CLI tool that scaffolds documentation blueprints designed for agent consumption. Instead of bloated repos or scattered prompts, Docugent gives your AI teammates a clean, token-efficient folder of structured instructions, ready to reuse across projects.

While originally designed for developers, Docugent’s modular folder structure can be adapted for structured thinking in other fields—content planning, education, research, and beyond.

With Docugent, your documentation becomes a reusable memory scaffold.

## 🚀 Getting Started

Install globally:

```bash
npm install -g docugent
```

Then scaffold a `.docugent/` folder in your project:

```bash
docugent scaffold core
```

Or scaffold other scoped documentation:

```bash
docugent scaffold addons
docugent scaffold tech-seo
docugent scaffold changelog
```

## 🛠️ CLI Commands

```bash
# Scaffold core structure
docugent scaffold core

# Add checklists (optional)
docugent scaffold core --with-checklists

# Enable safe overwrites
docugent scaffold core --force --backup
```

### Tips & Customization

- Use `--backup` to automatically create `.bak` files for anything being overwritten.
- Folder scaffolding is modular and opt-in. You can scaffold specific scopes like `tech-seo`, `addons`, or `qa` independently.
- Advanced behavior (e.g. token limits, file exclusions) can be customized using `.docugent/llm-load.yml` or `.docugent/agent.yml`.

## 🧠 How It Works

Docugent creates a folder of structured, markdown-based blueprints under `.docugent/`. These are designed to be consumed by LLMs and reused across build workflows.

Example folder structure:

```
.docugent/
├── qa/
│   └── checklist.md
├── security/
│   └── auth.md
├── agent-instructions.md
├── README.md
```

Files are grouped by scope and optimized for token efficiency. You can generate agent-briefings using:

```bash
docugent scaffold core --llm=claude
```

Which outputs:

```
.docugent/agent-briefings/claude.md
```

## 📦 Features

- Modular scaffold structure (core, addons, tech-seo, etc.)
- Token-efficient, agent-specific briefings
- `--with-checklists` for rich template content
- `--force` and `--backup` to safely overwrite files
- CLI tested with Claude, Codex, and GPT agents
- Blueprint-ready for use in multi-agent LLM workflows

## 🧪 Contributing & Testing

Run unit tests using Vitest:

```bash
npm run test
```

Watch test output live:

```bash
npm run test:watch
```

Note: This is for testing the CLI—not your `.docugent/` content.

---

Docugent is perfect for prompt-aware app development, scoped prototyping, and multi-agent project scaffolding.
