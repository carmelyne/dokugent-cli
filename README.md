# Dokugent CLI

*Alpha release – under active development*

## 🧬 About

AI agents need more than raw code—they need context, structure, and guidance.

**Dokugent** is a documentation-first CLI tool for building, testing, and coordinating AI agents using simple Markdown and JSON scaffolds. It prioritizes transparency, human-in-the-loop workflows, and model-agnostic compatibility.

Instead of bloated repos or scattered prompts, Dokugent gives your AI teammates a clean, token-efficient folder of structured instructions, ready to reuse across projects.

While originally designed for developers, Dokugent’s modular structure can also support structured thinking in content planning, education, research, and more.

---

## 🚀 Features

- 📁 Scaffolds agent projects with `init` and `wizard`
- 🧠 Plans and compiles agent behavior from Markdown
- 🛡️ Enforces conventions and traceable criteria
- 🔐 Certifies and simulates agent reasoning flows
- 📦 Supports Claude, Codex, GPT-4, Gemini, LLaMA via `agents.yml`

---

## 🛠 Getting Started

```bash
npm install -g dokugent
```

Then scaffold your first project:

```bash
dokugent init
# then optionally
dokugent wizard
```

---

## 🔧 CLI Commands

- `dokugent init` — scaffolds `.dokugent` folder structure and default files
- `dokugent wizard` — interactively configures agent or app type, tools, and sets up project files
- `dokugent plan` — defines the agent’s high-level steps or capabilities
- `dokugent conventions` — describes and enforces documentation structure
- `dokugent criteria` — defines validation rules, safety thresholds, and constraints
- `dokugent preview` — renders plan, conventions, and criteria for human review before compiling
- `dokugent security` — validates against unsafe actions, tools, or behavior
- `dokugent certify` — certifies agents or plans against predefined safety protocols
- `dokugent compile` — compiles structured files into agent-readable prompts
- `dokugent dryrun` — simulates agent behavior without real LLM calls
- `dokugent simulate` — runs a test session with real or mocked model responses
- `dokugent trace` — logs and inspects a model's step-by-step reasoning
- `dokugent review` — checks trace output against expected behavior or goals
- `dokugent keygen` — generates and stores API keys or access tokens

---

## 🧱 Philosophy

Dokugent embraces a protocol-first mindset for building intelligent systems. You don’t start by coding — you start by thinking, documenting, and aligning. This structure keeps your agents safe, traceable, and easy to reconfigure.

With Dokugent, your documentation becomes a reusable memory scaffold.

---

## 🛡 License

Dokugent is licensed under the [PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/).

✅ Use it for personal projects, client work, or internal tooling  
❌ You can’t use it to build a competing product or service

For commercial licensing or collaboration, feel free to reach out 💬
