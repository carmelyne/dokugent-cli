# dokugent certify

Certifies a previously previewed agent by bundling verified files into a signed, timestamped output.  
This is the final checkpoint before deployment or publishing.

---

## 🔧 What It Does

- Locates `.dokugent/preview/latest` output
- Copies and renames files into a `.dokugent/certified/<version>/` folder
- Generates SHA256 digests for certification
- Writes metadata and logs:
  - `*.cert.json`
  - `*.cert.sha256`
  - `certify@*.log`
- Updates symlink: `certified/latest`

---

## 🧪 Behavior Overview

- Resolves latest preview and parses agent name from specs
- Checks `.dokugent/keys/<agent>.private.pem` for signing eligibility
- Flattens files into readable, cert-friendly naming:

  ```plaintext
  agent-agent-spec.cert.json
  agent-tool-list.cert.json
  preview-plan.cert.json
  ```

- Applies SHA256 digests (no public/private key signing yet)
- Summarizes certified state in:

  ```json
  {
    "agent": "summarybot",
    "sha256": "abc123...",
    "timestamp": "...",
    "version": "preview-20240517",
    "files": [...]
  }
  ```

---

## 📁 Output Folder Structure

```plaintext
.dokugent/certified/preview-20240517-summarybot/
├── agent-agent-spec.cert.json
├── agent-tool-list.cert.json
├── preview-plan.cert.json
├── preview-plan.cert.sha256
├── summarybot.cert.sha256
├── summarybot.cert.json
```

Also:

```
.dokugent/certified/latest → preview-20240517-summarybot/
```

---

## 🔐 Output Locks

All certified files are set to read-only (`chmod 444`) to preserve integrity.  
This ensures artifacts can be inspected or verified without accidental mutation

---

## ✅ Example CLI Flow

```bash
dokugent certify
```

```plaintext
📁 Certifying agent summarybot from preview-20240517...
🔒 SHA256 digest: 27adf3c1...
📄 Output written to .dokugent/certified/preview-20240517-summarybot
📎 Symlink updated: .dokugent/certified/latest
```
