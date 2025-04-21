# Docugent CLI

*Alpha release – under active development*

## 🧬 About

AI agents need more than raw code—they need context, structure, and guidance.

**Docugent** was built to solve that. It’s a CLI tool that scaffolds documentation blueprints designed for agent consumption. Instead of bloated repos or scattered prompts, Docugent gives your AI teammates a clean, token-efficient folder of structured instructions, ready to reuse across projects.

While originally designed for developers, Docugent’s modular folder structure can be adapted for structured thinking in other fields—content planning, education, research, and beyond.

With Docugent, your documentation becomes a reusable memory scaffold.

## 🚀 Getting Started

> 🚧 Docugent is not yet published to NPM. Until then, you can run it locally:

```bash
git clone https://github.com/carmelyne/docugent-cli.git
cd docugent-cli
npm install
npm link
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
docugent compile --llm=codex
docugent compile --llm=claude
```

Which output:

```
.docugent/agent-briefings/codex.md
.docugent/agent-briefings/claude.md
```

💡 Note: compile reads from .docugent/llm-load.yml and outputs a token-optimized context file into .docugent/agent-briefings/.

## 📦 Features

- Modular scaffold structure (core, addons, tech-seo, etc.)
- Token-efficient, agent-specific briefings
- `--with-checklists` for rich template content
- `--force` and `--backup` to safely overwrite files
- CLI tested with Claude, Codex, and GPT agents
- Blueprint-ready for use in multi-agent LLM workflows

## 🤖 Supported LLMs

Docugent supports agent-briefings tailored to different language models via the `--llm` flag.

| Model      | Flag         | Best For                                       | Notes |
|------------|--------------|------------------------------------------------|-------|
| Codex      | `--llm=codex`  | Precise code reasoning, CLI tasks, token efficiency | Works well with dev-heavy markdown |
| Claude     | `--llm=claude` | Broad context understanding, agent structuring, protocol logic | Responds well to structured docs + reasoning |
| Gemini     | `--llm=gemini` | Multi-modal workflows (text + image), UI/UX feedback | Early support only, APIs vary |
| LLaMA 3    | `--llm=llama3` | Open-source use, cost-efficient agent workflows | Needs custom context control |

## 💡 Why I Made Docugent

I kept running into the same problem while building with AI: LLMs are powerful, but they need structure to reason well.

Too often, I’d open a repo, drop in a prompt, and hope for the best. It wasn’t scalable—and it wasn’t repeatable.

Docugent is my answer to that. It’s a tool that helps both humans and agents start from the same structured base. Whether you’re scaffolding a new app or trying to reuse context across builds, Docugent gives your documentation a memory-friendly shape.

I built it for myself at first. Now it’s ready for anyone else who’s tired of prompting from scratch.

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
