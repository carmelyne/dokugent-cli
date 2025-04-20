# 📍 Docugent CLI – Roadmap to Beta

This document outlines the final steps before we ship Docugent as a public beta.

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

### Nice-to-Have

- [ ] Polish `README.md` for newcomers
- [ ] Add a `docugent help` command
- [ ] Optional postinstall message

---

## 🚀 Beta Launch Checklist

- [ ] Set version to `0.9.0-beta`
- [ ] Publish to NPM
- [ ] Announce on GitHub + social media
