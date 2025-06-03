# Dokugent CLI

*Alpha release – under active development*

## 🧬 About

AI agents need more than raw code—they need context, structure, and guidance.

**Dokugent** is a markdown-native, documentation-first CLI tool for building, testing, and coordinating AI agents using simple Markdown and JSON scaffolds. It prioritizes transparency, human-in-the-loop workflows, and model-agnostic compatibility.

Instead of bloated repos or scattered prompts, Dokugent gives your AI teammates a clean, token-efficient folder of structured instructions, ready to reuse across projects.

While originally designed for developers, Dokugent’s modular structure can also support structured thinking in content planning, education, research, and more.

## 🚀 Features

- 📁 Scaffolds agent projects with `init` and `wizard`
- 🧠 Plans and compiles agent behavior from Markdown
- 🛡️ Enforces conventions and traceable criteria
- 🔐 Certifies and simulates agent reasoning flows
- 📦 Supports Claude, Codex, GPT-4, Gemini, LLaMA, Nvidia via `agent --ecosystem` or `conventions`

## 🛠 Getting Started

```bash
npm install -g dokugent
```

---

## 🔧 CLI Commands

- ✅ `dokugent init` — scaffolds `.dokugent` folder structure and default files
- ✅ `dokugent wizard` — interactively configures agent or app type, tools, and sets up project files
- ✅ `dokugent plan` — defines the agent’s high-level steps or capabilities
- ✅ `dokugent conventions` — describes and enforces documentation structure
- ✅ `dokugent criteria` — defines validation rules, safety thresholds, and constraints
- ✅ `dokugent security` — validates against unsafe actions, tools, or behavior
- ✅ `dokugent preview` — renders plan, conventions, and criteria for human review before compiling
- ✅ `dokugent keygen` — generates cryptographic signing keys for certifying agent files & verifying trust
- ✅ `dokugent certify` — certifies agents or plans against predefined safety protocols
- ✅ `dokugent compile` — compiles structured files into agent-readable prompts
- ✅ `dokugent dryrun` — simulates agent behavior without real LLM calls
- ✅ `dokugent simulate` — runs a test session with a any local LLM on Ollama
- ✅ `dokugent trace` — audits a previously certified agent to verify using a remote doku:// URI
- ✅ `dokugent inspect` — fetches and displays certified agent files from local or remote URIs
- 🔲 `dokugent review` — checks trace output against expected behavior or goals

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
