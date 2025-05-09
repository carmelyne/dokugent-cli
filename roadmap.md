# 📍 Dokugent CLI – Roadmap to Beta

This document outlines the final steps before we ship Dokugent as a public beta.

---

### Agentic Safety Features

- [X] Compile immutable, versioned blueprints post-approval
- [ ] Support agent-specific output templates (OpenAI, LangChain, etc.)
- [X] Hash and embed metadata in compiled instructions (via .cert + SHA checking in `dokugent verify`)
- [ ] Include human + machine readable formats in output bundle
- [ ] Document alignment with Microsoft's AI failure mode taxonomy
- [ ] Optional signature/approval field in blueprint metadata

### CLI & Project Polish

- [ ] Add `dokugent help` with grouped command categories
- [ ] Add support for `.dokugentrc` config overrides
- [ ] Improve logging and token efficiency feedback
- [X] Document easter eggs ('marites', 'secrets') for fun and transparency
- [ ] Add more `examples/` (e.g. grading-system.md, open-llm-awareness.md)
- [X] Clarify license intent and boundaries (DONE)
- [ ] Add optional postinstall message

### New CLI Commands (Stable)

- [X] `init` – Scaffold a Dokugent project with structure.yaml and templates
- [X] `wizard` — interactively configures agent or app type, tools, and sets up project files
- [X] `plan` – Generate or inspect plan.yaml for agent workflows
- [X] `conventions` – Load or apply structural/tagging conventions
- [X] `criteria` – Define project rules and behavioral constraints
- [X] `preview` — renders plan, conventions, and criteria for human review before compiling
- [X] `security` – Run blacklist scans and signature checks for risky content
- [X] `certify` – Snapshot and lock project state via .cert.* files
- [X] `keygen` – Generate signing keys for certification processes

### New CLI Commands (In Progress)

- [ ] `compile` – Convert preview files into structured agent-ready output

### New CLI Commands (Planned)

- [ ] `dryrun` – Simulate command flow without executing agent logic
- [ ] `simulate` – Emulate step-by-step plan execution for debugging or training
- [ ] `trace` – Map or inspect file relationships and logical dependencies
- [ ] `review` – Evaluate compiled output against criteria and plan

---

## 🌱 Field-Agnostic Future Support (hint)

- Plan for domain-aware scaffolds (e.g., `research`, `civic`, `education`, etc.)
- Explore contextual vocabulary overlays per field
- Maintain protocol/action separation while allowing vocabulary remapping (e.g., `review.md` → `study.md`)
- Consider field-specific linting and certification criteria
- Ensure Dokugent stays a universal tool that adapts to how people structure and execute intent

## 🚀 Beta Launch Checklist

- [ ] Set version to `0.9.0-beta`
- [ ] Publish to NPM
- [ ] Publish dokugent.com landing page with basic docs + example showcase
- [ ] Announce launch on GitHub, Threads, Bluesky, LinkedIn
- [ ] Document `@tag` behavior in a blog post or discovery thread
