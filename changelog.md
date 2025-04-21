# 📝 Changelog v0.1

Use this file to document notable changes in this version of the project. Follow the format below to keep updates clear and traceable.

## ✨ Added

- Initial scaffold using `dokugent scaffold core`
- `.dokugent/ux/flows.md` seeded with starter checklist
- Dependency safety policy introduced in `devops/dependency-policy.md`
- Agent-ready templates for:
  - `mvc/controllers.md`, `models.md`, `views.md`, `routes.md`
  - `qa/checklist.md`, `security/auth.md`, `db-schema/models.md`
- `README.md` updated with clear usage instructions and customization tips

## 🛠 Changed

- CLI supports `--force` and `--backup` for safe overwrites

## 🐛 Fixed

- Prevented accidental overwrites of existing `.dokugent` files

## 🔍 Notes

- This changelog should be updated anytime a significant file, logic, or structure changes inside the project.
- All scaffold templates are now token-efficient and useful as agent prompts
