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

- [ ] Add a staging layer for human-readable instruction review
- [ ] Compile immutable, versioned blueprints post-approval
- [ ] Support agent-specific output templates (OpenAI, LangChain, etc.)
- [ ] Hash and embed metadata in compiled instructions
- [ ] Include human + machine readable formats in output bundle
- [ ] Document alignment with Microsoft's AI failure mode taxonomy
- [ ] Optional signature/approval field in blueprint metadata

### CLI & Project Polish

- [ ] Add a `dokugent help` command
- [X] Enforce blueprint.md for --custom scaffolds
- [X] Finalize tag chaining support (v1)
- [ ] Add support for `.dokugentrc` config overrides
- [ ] Add optional footer signature for agent-briefings
- [ ] Improve logging and token efficiency feedback
- [X] Document easter eggs ('marites', 'secrets') for fun and transparency
- [ ] Create a `tag-protocol.md` reference for Doku Tags
- [ ] Add more `examples/` (e.g. grading-system.md, open-llm-awareness.md)
- [ ] Update README with Doku Tag explanation and usage
- [X] Clarify license intent and boundaries (DONE)
- [ ] Optional postinstall message

---

## 🚀 Beta Launch Checklist

- [ ] Set version to `0.9.0-beta`
- [ ] Publish to NPM
- [ ] Publish dokugent.com landing page with basic docs + example showcase
- [ ] Announce launch on GitHub, Threads, Bluesky, LinkedIn
- [ ] Document `@tag` behavior in a blog post or discovery thread
