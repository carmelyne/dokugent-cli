# dokugent init

Initializes a new Dokugent project by creating the required folder structure, setting up agent scaffolding, and optionally bypassing the wizard with default values.

---

## 🔧 What It Does

- Scaffolds `.dokugent/` directory structure
- Generates `README.md`, agent spec files, and tool list
- Supports `--yes` for default (non-interactive) init

---

## 🧪 Behavior Overview

### 🟡 Mode Detection

```ts
const useDefaultsOnly = process.argv.includes('--yes');
```

- If `--yes` is passed, uses default values
- Otherwise runs interactive `promptInitWizard()`

---

### 📁 Directories Created

```plaintext
.dokugent/
├── plan/
├── criteria/
├── conventions/
├── preview/
├── certified/
├── compiled/
├── reports/
├── logs/
├── overrides/
│   └── whitelist.txt
```

---

### 📦 Agent Folder Output

```
.dokugent/agent-info/agents/agent-spec/init/<agentName>/
├── agent-spec.md
├── agent-spec.json
├── tool-list.md
```

---

## ⚙️ Default Answers for `--yes`

```json
{
  "agentName": "default-agent",
  "description": "Assist with general research and summarization.",
  "roles": ["researcher", "validator"],
  "protocols": ["design-intent"],
  "outputs": ["JSON"],
  "understands": ["yaml"],
  "allowExternalFiles": false,
  "requireApproval": true,
  "denylist": ["blacklist-health.txt"]
}
```

---

## 📄 Additional Files

- `.dokugent/README.md` → static intro
- `tool-list.md` → stub tools: `summarize-tool`, `validate-tool`

---

## ✅ Console Output Example

```plaintext
🎉 Dokugent agent scaffolding complete!

📁 Output directory: .dokugent
📄 Files created:
   - README.md
   - agent-spec.md
   - agent-spec.json
   - tool-list.md
🔒 Denylist overrides saved to: .dokugent/overrides/blacklist/

✅ You can now continue with: dokugent plan
```
