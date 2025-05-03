# QA Checklist for Agent-Readable Documentation

Use this checklist to validate that the `.dokugent/` folder is ready for agent consumption and reuse.

## ✅ Structure

- [ ] Folder follows expected blueprint (e.g. `ux/`, `qa/`, `security/`)
- [ ] No empty files unless intentionally stubbed with comments
- [ ] File paths match what's referenced in `agent-instructions.md`

## 🧠 LLM Compatibility

- [ ] Token usage across files is within recommended limits
- [ ] No duplicated sections across agent-briefings
- [ ] Avoids recursion or ambiguous nesting

## 🔍 Content Integrity

- [ ] Instructions are actionable (not just notes or theory)
- [ ] Checklists use consistent syntax (e.g. `- [ ]`)
- [ ] Briefings reference real, scaffolded files only

## 🚫 Warnings & Edge Cases

- [ ] `.bak` files are ignored or removed from final briefings
- [ ] No accidental commits of `presets/`, `node_modules/`, or `.log` files
