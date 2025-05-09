# 📝 Changelog v0.1

Use this file to document notable changes in this version of the project. Follow the format below to keep updates clear and traceable.

## ✨ Added

- `structure.yaml` support added to `certify` via `lib/config/structure.yaml`
- `agentSpec.json`, `plan.yaml`, `criteria.yaml`, and `structure.yaml` introduced under `.dokugent/self/` for self-certification

## 🛠 Changed

- Certification logic updated to load paths from structure.yaml
- CLI output now logs warnings for empty files skipped during certification
- `.cert.*` files are now created with read-only (chmod 444) permissions
- Certification failure reports now include security scan output
- CLI supports `--force` and `--backup` for safe overwrites

## 🐛 Fixed

- Prevented accidental overwrites of existing `.dokugent` files

## 🔍 Notes

- This changelog should be updated anytime a significant file, logic, or structure changes inside the project.
- All scaffold templates are now token-efficient and useful as agent prompts

# 📝 Changelog v0.1

Initial milestone release of Dokugent CLI.

## ✨ Features

- Core command support:
  - `init`, `wizard`, `plan`, `criteria`, `conventions`, `compile`, `certify`, `preview`, `security`, `keygen`
- New `.dokugent/self/` directory:
  - Includes `agentSpec.json`, `plan.yaml`, `criteria.yaml`, `structure.yaml`
  - Enables Dokugent to reason about and certify its own configuration
- Certification improvements:
  - Automatically generates `.cert.*` snapshots for `.md`, `.yaml`, `.mjs`
  - Skips empty files with a warning
  - Sets `.cert.*` files to read-only (chmod 444)
  - Failed certifications now include full security scan output
  - Uses structure.yaml for path resolution

## 🛠 Enhancements

- File structure parsing via `loadSpecStructure.js`
- Cleaner path management with `lib/config/structure.yaml`
- Certified output logs show clear success/warning status

## 🧪 Developer Experience

- Refactored CLI outputs for clarity
- Modularized parsing logic into `lib/parsers/`
- Improved Git commit history and changelog management
