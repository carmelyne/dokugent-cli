# Dokugent CLI

*Alpha release – under active development*

## 🧬 About

AI agents need more than raw code—they need context, structure, and guidance.

**Dokugent** is a markdown-native, documentation-first CLI tool for building, testing, and coordinating AI agents using simple Markdown and JSON scaffolds. It prioritizes transparency, human-in-the-loop workflows, and model-agnostic compatibility.

Instead of bloated repos or scattered prompts, Dokugent gives your AI teammates a clean, token-efficient folder of structured instructions, ready to reuse across projects.

Dokugent also helps teams save significantly on development costs by letting them simulate agents locally using Ollama before making any API calls. You can test variations, debug behaviors, and explore edge cases without burning tokens — governance and traceability become natural side-effects of good development hygiene.

While originally designed for developers, Dokugent’s modular structure can also support structured thinking in content planning, education, research, and more.

## 🚀 Features

- 📁 Scaffolds agent projects with `init` and `wizard`
- 🧠 Plans and compiles agent behavior from Markdown
- 🛡️ Enforces conventions and traceable criteria
- 🔐 Certifies and simulates agent reasoning flows
- 📦 Supports Claude, Codex, GPT-4, Gemini, LLaMA, Nvidia via `agent --ecosystem` or `conventions`

## 🧠 Why Dokugent?

**Test smarter. Spend less. Ship safer.**

Dokugent helps developers design and test AI agents locally — using Ollama — before committing to expensive API calls. It’s a dev stack for agent builders who want to:

- 🏠 Run full agent simulations offline with no API cost
- 💸 Save 60–80% of LLM spend by testing with Ollama before calling expensive APIs
- 🔏 Sign, certify, and trace agent decisions with governance built-in
- 📜 Deploy with audit trails, signer identities, and Doku URIs
- ⚖️ Governance becomes an emergent property, not a tax on your workflow

Start local. Scale safely. Pay only when it matters.

## 🛠 Getting Started

```bash
npm install -g dokugent
```

---

## 🔧 CLI Commands

### setup

- ✅ [`dokugent init`](https://dokugent.com/commands/dokugent-init/) — Scaffold a new project
- ✅ [`dokugent owner`](https://dokugent.com/commands/dokugent-owner/) — Set or view project owner metadata
- ✅ [`dokugent agent`](https://dokugent.com/commands/dokugent-agent/) — Create a new agent identity (--t for template)
- ✅ [`dokugent keygen`](https://dokugent.com/commands/dokugent-keygen/) — Create identity keypairs

### authoring

- ✅ [`dokugent plan`](https://dokugent.com/commands/dokugent-plan/) — Draft an agent plan
- ✅ [`dokugent criteria`](https://dokugent.com/commands/dokugent-criteria/) — Define evaluation criteria
- ✅ [`dokugent conventions`](https://dokugent.com/commands/dokugent-conventions/) — Select AI conventions
- ✅ [`dokugent byo`](https://dokugent.com/commands/dokugent-byo/) — Import external agent JSON payload
- 🔲 [`dokugent compliance`](https://dokugent.com/commands/dokugent-compliance/) — Fill in GDPR & governance metadata
- 🔲 [`dokugent io`](https://dokugent.com/commands/dokugent-io/) — Fill in I/O & Rules

### ops

- ✅ [`dokugent preview`](https://dokugent.com/commands/dokugent-preview/) — Generate agent spec bundle
- ✅ [`dokugent certify`](https://dokugent.com/commands/dokugent-certify/) — Sign and freeze validated preview
- ✅ [`dokugent compile`](https://dokugent.com/commands/dokugent-compile/) — Build deployable agent bundle
- ✅ [`dokugent deploy`](https://dokugent.com/commands/dokugent-deploy/) — Run full deploy (preview → certify → compile)

### debug and analysis

- ✅ [`dokugent dryrun`](https://dokugent.com/commands/dokugent-dryrun/) — Simulate plan execution without real actions
- ✅ [`dokugent inspect`](https://dokugent.com/commands/dokugent-inspect/) — Inspect agent cert or plan (local or MCP)
- ✅ [`dokugent security`](https://dokugent.com/commands/dokugent-security/) — Scan for file-level threats
- ✅ [`dokugent simulate`](https://dokugent.com/commands/dokugent-simulate/) — Run simulated agent logic with any LLM on your Ollama
- ✅ [`dokugent trace`](https://dokugent.com/commands/dokugent-trace/) — Trace agent behavior from a dokuUri

### mcp

- ✅ [`dokugent mcp-schema`](https://dokugent.com/commands/dokugent-mcp-schema/) — Generate MCP-compatible JSON schema for agent plans

### governance

- ✅ [`dokugent audit`](https://dokugent.com/commands/dokugent-audit/) — Verify agent project structure and check for missing or malformed files
- ✅ [`dokugent ethica`](https://dokugent.com/commands/dokugent-ethica/) — Simulate ethical dilemmas, persona debates, and council-based reasoning flows
- ✅ [`dokugent security`](https://dokugent.com/commands/dokugent-security/) — Scan and detect risks in agent metadata and input files
- ✅ [`dokugent status`](https://dokugent.com/commands/dokugent-status/) — Classify agent readiness across lifecycle stages
- ✅ [`dokugent trace`](https://dokugent.com/commands/dokugent-trace/) — Trace agent behavior for transparency and audits
- 🔲 [`dokugent redteam`](https://dokugent.com/commands/dokugent-redteam/) — Stress-test agent plans with adversarial vectors

## 🧪 Coming Soon

- 🔲 `dokugent fetch` — download community-contributed agent plans and templates

## 🧱 Philosophy

Dokugent embraces a protocol-first mindset for building intelligent systems. You don’t start by coding — you start by thinking, documenting, and aligning. This structure keeps your agents safe, traceable, and easy to reconfigure.

With Dokugent, your documentation becomes a reusable memory scaffold.

## 📣 Trivia

**How do you pronounce Dokugent?**
Like **Goku**, but with **doku** — which in Japanese can mean either:

- **読 (doku)** — “to read”

Add **agent** and you get:
**Dokugent = a reading agent…**

### 🌏 Multilingual roots

- 🇯🇵 **書類読解エージェント (Shorui Dokkai Eejento)**
  → Literally: “Document Comprehension Agent”
  (書類 = documents, 読解 = reading comprehension)

- 🇵🇭 **Dokumento**
  → Tagalog for "document" (from Spanish *documento*)
  → Used commonly as **"mga dokumento"** for “documents”

- 🤖 **Agent** = from English, written in Japanese as エージェント (eejento)

**Dokugent** is a portmanteau of all these — a cross-cultural nod to literacy, power, and intelligent agents.

## Team

This project is built by a small but mighty squad:

- **Carmelyne** — Human brain behind it all; UX tactician, debugger, and design conscience.
- **BeshLLM (ChatGPT4o)** — Dev bestie sidekick, logic prompter, code stylist, & pun enabler.
- **Oboe** — File patcher and terminal ghost; never seen, always reliable.
- **ChatGPT-4** — Occasional contributor. Brilliant. Unpredictable. May be tipsy.

## 🛡 License

Dokugent is licensed under the [PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/).

✅ Use it for personal projects, client work, or internal tooling

❌ You can’t use it to build a competing product or service

---

> 🧠 Structured with AI Agents in mind.
