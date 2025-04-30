# Dokugent CLI

*Alpha release – under active development*

## 🧬 About

AI agents need more than raw code—they need context, structure, and guidance.

**Dokugent** was built to solve that. It’s a CLI tool that scaffolds documentation blueprints designed for agent consumption. Instead of bloated repos or scattered prompts, Dokugent gives your AI teammates a clean, token-efficient folder of structured instructions, ready to reuse across projects.

While originally designed for developers, Dokugent’s modular folder structure can be adapted for structured thinking in other fields—content planning, education, research, and beyond.

With Dokugent, your documentation becomes a reusable memory scaffold.

## 🚀 Getting Started

> 🚧 Dokugent is not yet published to NPM. Until then, you can run it locally:

```bash
git clone https://github.com/carmelyne/dokugent-cli.git
cd dokugent-cli
npm install
npm link
```

Then scaffold a `.dokugent/` folder in your project:

```bash
dokugent scaffold core
```

Or scaffold other scoped documentation:

```bash
dokugent scaffold addons
dokugent scaffold tech-seo
dokugent scaffold changelog
```

# Scaffold a blank folder for your own custom scope

dokugent scaffold --custom=ai-labs --blueprint=blank

```

> 🔖 The `--custom` flag creates an empty folder inside `.dokugent/` using your provided name.
> 🚫 It must be used on its own—no other flags or arguments allowed.

## 🛠️ CLI Commands

### scaffold
  --force            Overwrite existing files
  --backup           Create .bak backups before overwriting
  --with-checklists  Include checklist-enhanced templates
  --custom=<folder>  Create an empty folder inside .dokugent/ with the given name

### stage
  --scope <folder>   Target folder to stage (defaults to .dokugent)
  --protocols <list> Comma-separated protocol folders or "all"

### keygen
  --name <string>    Identity used to label public key metadata

### certify
  --key <path>       Path to private key for certification

### compile
  --llm <agent>      Agent to compile briefing for
  --prod             Enforce SHA + signature verification from review.cert
  --dev              Compile from llm-load.yml (for isolated dev testing)

## 🧪 Examples

```bash
dokugent scaffold core
dokugent scaffold core --with-checklists --backup
dokugent scaffold --custom=ai-labs --blueprint=svelte
dokugent stage --protocols=all
dokugent stage --protocols=qa,ux
dokugent keygen --name carmelyne@kinderbytes.com
dokugent certify --key .dokugent/keys/id_doku_priv.pem
dokugent compile --llm=codex --prod
dokugent compile --llm=codex --dev
```

### Tips & Customization

- Use `--backup` to automatically create `.bak` files for anything being overwritten.
- Folder scaffolding is modular and opt-in. You can scaffold specific scopes like `tech-seo`, `addons`, or `qa` independently.
- Advanced behavior (e.g. token limits, file exclusions) can be customized using `.dokugent/llm-load.yml` or `.dokugent/agent.yml`.

## 🧠 How It Works

Dokugent creates a folder of structured, markdown-based blueprints under `.dokugent/`. These are designed to be consumed by LLMs and reused across build workflows.

Example folder structure:

```
.dokugent/
├── qa/
│   └── checklist.md
├── security/
│   └── auth.md
├── agent-instructions.md
├── README.md
```

Files are grouped by scope and optimized for token efficiency. You can generate agent-briefings using:

```bash
dokugent compile --llm=codex
dokugent compile --llm=claude
```

Which output:

```
.dokugent/agent-briefings/codex.md
.dokugent/agent-briefings/claude.md
```

💡 Note: compile reads from .dokugent/llm-load.yml and outputs a token-optimized context file into .dokugent/agent-briefings/.

## 📦 Features

- Modular scaffold structure (core, addons, tech-seo, etc.)
- Token-efficient, agent-specific briefings
- `--with-checklists` for rich template content
- `--force` and `--backup` to safely overwrite files
- CLI tested with Claude, Codex, and GPT agents
- Blueprint-ready for use in multi-agent LLM workflows
- Cryptographic certification of instructions via RSA keypair
- `.gitignore` scaffolding to protect private keys and certs

## 🤖 Supported LLMs

Dokugent supports agent-briefings as compiled-agent-specs tailored to different language models via the `--llm` flag.

| Model      | Dokugent CLI Flags         | Best For                                       | Notes |
|------------|--------------|------------------------------------------------|-------|
| Codex      | `--llm=codex`  | Precise code reasoning, CLI tasks, token efficiency | Works well with dev-heavy markdown |
| Claude     | `--llm=claude` | Broad context understanding, agent structuring, protocol logic | Responds well to structured docs + reasoning |
| Gemini     | `--llm=gemini` | Multi-modal workflows (text + image), UI/UX feedback | Early support only, APIs vary |
| LLaMA 3    | `--llm=llama3` | Open-source use, cost-efficient agent workflows | Needs custom context control |

## 💡 Why I Made Dokugent

I kept running into the same problem while building with AI: LLMs are powerful, but they need structure to reason well.

Too often, I’d open a repo, drop in a prompt, and hope for the best. It wasn’t scalable—and it wasn’t repeatable.

Dokugent is my answer to that. It’s a tool that helps both humans and agents start from the same structured base. Whether you’re scaffolding a new app or trying to reuse context across builds, Dokugent gives your documentation a memory-friendly shape.

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

Note: This is for testing the CLI—not your `.dokugent/` content.

## 🧩 Example Presets

You can find reusable, real-world prompt blueprints under:

| Folder Name        | Description                                         |
|--------------------|-----------------------------------------------------|
| `core/`            | Base app scaffolding like `mvc/`, `db-schema/`      |
| `qa/`              | Quality assurance templates like checklists         |
| `security/`        | Templates for auth logic, security practices        |
| `tech-seo/`        | Structured SEO and metadata instructions            |
| `marketing/`       | Launch checklists and campaign scaffolds            |
| `agent-briefings/` | Compiled briefings per LLM (`codex.md`, etc.)       |
| `examples/`        | Real-world sample blueprints (e.g. policy checker)  |

```
presets/examples/
```

Example: `policy-checker.md`

This file includes a structured instruction pattern for:

- Document analysis [@document_analysis]
- Vector search alignment [@vector_search]
- Summary generation [@text_generation]

Great for agents that assess sustainability policies or conduct compliance reviews.

## 🧠 Supported Tool Tags (for Agents)

When writing Dokugent templates, you can annotate steps with tool tags to signal agent capabilities. These tags help LLM agents parse the instruction and decide what action to take, especially in multi-tool environments.

### Current Supported Tags

| Tag                   | Description |
|------------------------|-------------|
| `@document_analysis`   | Parse and extract key info from uploaded files |
| `@vector_search`       | Perform semantic similarity or alignment against target data |
| `@text_generation`     | Generate a natural language summary or report |
| `@code_execution`      | Run or simulate execution of code blocks |
| `@web_browsing`        | Fetch or reference information from external sources |
| `@rag_retrieval`       | Retrieve chunks from RAG-augmented knowledge base |
| `@image_analysis`      | Analyze image input for description, labels, or metadata |
| `@knowledge_graph`     | Build or query structured knowledge connections |

> 💡 These tags are not enforced, but serve as signals for LLM-based agents trained to recognize them.
> 🧪 Observed Behavior: Leading a prompt with a tool tag like `@text_generation:` or `@document_analysis:` helps Codex immediately recognize task intent and skip default filesystem exploration. This can make your agent outputs faster, cleaner, and more focused.

---

### 🛡 License

Dokugent is licensed under the [PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/).

✅ You can use it for personal projects, paid client work, or internal company tooling.  
❌ You just can’t use it to build a competing product or service.

For commercial licensing or collaboration, feel free to reach out 💬

---

Dokugent is perfect for prompt-aware app development, scoped prototyping, and multi-agent project scaffolding.

---
