
# dokugent compile

Generates a final, canonical JSON artifact of your certified agent, bundling all verified components for deployment, agent runners, or external validation tools.

---

## 🔧 What It Does

- Loads data from `.dokugent/certified/latest`
- Compiles all `*.cert.json` into a normalized structure
- Assembles a canonical `compiled.json` with metadata
- Writes full + simplified versions:
  - `compiled-<timestamp>-<agent>.json`
  - `compiled.json` (canonical Volt spec)
- Generates SHA256 fingerprints and a compile report
- Updates symlinks for latest compiled version

---

## 🧪 Behavior Overview

- Scans certified folder for agent files, tools, plan, criteria, conventions
- Uses `DokuVoltAssembler` to unify structure
- Computes per-file token estimates
- Generates a single summary object for downstream agents or publishing

---

## 📁 Output Folder Structure

```plaintext
.dokugent/compiled/
├── compiled-20240517-summarybot.json
├── compiled-20240517-summarybot.sha256
├── compiled.json
├── latest.json    → compiled-*.json
├── latest.sha256  → compiled-*.sha256
```

---

## 🧠 Canonical Metadata (`compiled.json`)

```json
{
  "agent": "summarybot",
  "owner": "kinderbytes",
  "signer": "key-ed25519-01.pem",
  "mainTask": "Summarize input as 3 bullet points",
  "version": "2025-05-17T10:12:04Z",
  "uri": "doku:agent/summarybot@2025-05-17.kinderbytes",
  "tools": [...],
  "planSteps": [...],
  "criteria": [...],
  "conventions": [...]
}
```

---

## 📝 Logs and Reports

Generated into:

```plaintext
.dokugent/logs/compile/
.dokugent/reports/compile/
```

Each contains:

- Token summaries
- File digest table
- Compile metadata and paths

---

## 🛡️ Output Locks

Every compiled file is protected with `chmod 444`, making it read-only.  
This isn’t just a safety precaution—it’s a promise: that what you certified will stay intact, tamper-resistant, and traceable.

You can read, verify, or share these files freely. But mutation?  
That requires conscious override—because in Dokugent, trust is earned, and preserved.

---

## ✅ Example CLI Flow

```bash
dokugent compile
```

```plaintext
📦 Compiling certified agent summarybot...
🔐 SHA256 fingerprint: a43d91ab...
📄 Output saved to .dokugent/compiled/compiled-20240517-summarybot.json
📎 Symlink updated: .dokugent/compiled/latest.json
```
