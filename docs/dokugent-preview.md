
# dokugent preview

Converts all agent Markdown files into a structured JSON preview.  
This allows you to inspect and verify agent logic before certification.

---

## 🔧 What It Does

- Runs a full dry-compile of `.dokugent/` folders
- Converts:
  - `agent-spec.md`
  - `tool-list.md`
  - `plan.md`
  - `criteria.md`
  - `conventions/<mode>.md`
- Outputs preview JSON, SHA256 fingerprints, and token estimates

---

## 🧪 Behavior Overview

### 🟡 Workflow

1. Runs `runSecurityCheck()` for folder validation
2. Loads all `.md` files and parses them using frontmatter
3. Converts content into `.json` form
4. Calculates estimated tokens per section
5. Generates:
   - `preview-plan.json`
   - `preview-criteria.json`
   - `preview-conventions-dev.json`
   - `preview.sha256`
   - `preview.log` + `preview.report.json`
6. Sets output files to read-only
7. Symlinks `.dokugent/preview/latest` → current preview folder

---

## 📁 Output Structure

```plaintext
.dokugent/preview/preview-20240517/
├── specs/
│   └── summarybot/
│       ├── agent-spec.json
│       └── tool-list.json
├── preview-plan.json
├── preview-criteria.json
├── preview-conventions-dev.json
├── preview.sha256
├── preview.log
├── preview.report.json
```

Also:

```
.dokugent/preview/latest → preview-20240517/
```

---

## 🔐 Integrity & Token Audit

- All preview files are fingerprinted with SHA256
- File permissions set to read-only (`chmod 444`)
- Estimated token counts included in `preview.report.json`

---

## 🧠 Agent Identity Matching

Tries to match `agentKey` from `conventions/dev/` or fallback config  
and uses `agentsConfig.ts` for token profiles and devMode parsing.

---

## ✅ Example CLI Flow

```bash
dokugent preview
```

```plaintext
🔍 Rendering agent preview from Markdown sources...
📦 Output written to: .dokugent/preview/preview-20240517
📎 Symlink updated: .dokugent/preview/latest
📊 Total estimated tokens: 4318
```
