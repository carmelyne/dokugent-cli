# 📍 Dokugent CLI – Roadmap to Beta

This document outlines the final steps before we ship Dokugent as a public beta.

---

## ✅ Completed

- `--force` and `--backup` overwrite behavior
- `--with-checklists` loads rich templates
- Scoped folder scaffolding (`core`, `addons`, etc.)
- Intelligent UX copy for CLI feedback
- Agent instruction protocol defined
- Token-efficient file structure
- Tests pass without nuking presets
- Agent-ready templates for:
  - `qa/checklist.md`, `security/auth.md`, `db-schema/models.md`
  - `mvc/controllers.md`, `mvc/models.md`, `mvc/views.md`, `mvc/routes.md`
  - `agent-briefings/claude.md`, `agent-briefings/codex.md`
- README updated with usage, customization tips, and About context
- CLI renamed to Dokugent
- --custom flag added for user-defined scaffold folders
- Add a staging layer for human-readable instruction review

---

## 🛠️ To-Do for Beta

### Template Completion

- [X] `qa/checklist.md`
- [ ] `qa/edge-cases.md`
- [ ] `testing/unit.md`
- [ ] `testing/manual.md`
- [X] `security/auth.md`
- [ ] `tech-seo/meta.md`
- [ ] `tech-seo/sitemap.md`
- [ ] `marketing/launch-checklist.md`

### Agentic Safety Features

- [X] Compile immutable, versioned blueprints post-approval
- [ ] Support agent-specific output templates (OpenAI, LangChain, etc.)
- [X] Hash and embed metadata in compiled instructions (via .cert + SHA checking in `dokugent verify`)
- [ ] Include human + machine readable formats in output bundle
- [ ] Document alignment with Microsoft's AI failure mode taxonomy
- [ ] Optional signature/approval field in blueprint metadata

### CLI & Project Polish

- [ ] Add `dokugent help` with grouped command categories
- [X] Enforce `blueprint.md` for --custom scaffolds
- [X] Finalize tag chaining support (v1)
- [ ] Add support for `.dokugentrc` config overrides
- [ ] Add optional footer signature for agent-briefings
- [ ] Improve logging and token efficiency feedback
- [X] Document easter eggs ('marites', 'secrets') for fun and transparency
- [ ] Create `tag-protocol.md` reference for Doku Tags
- [ ] Add more `examples/` (e.g. grading-system.md, open-llm-awareness.md)
- [ ] Update README with Doku Tag usage + CLI workflow
- [X] Clarify license intent and boundaries (DONE)
- [ ] Add optional postinstall message

### New CLI Commands (Planned)

- [ ] `dokugent step` – Generate a `plan.yaml` from existing protocols (auto-plan)
- [ ] `dokugent dryrun` – Simulate plan steps without invoking tools (debug intent)
- [ ] `dokugent verify` – Check if compiled output matches cert (anti-tamper)
- [ ] `dokugent simulate` – Emulate step-by-step execution with agent mock
- [ ] `dokugent watch` – Monitor for changes that invalidate certification

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
