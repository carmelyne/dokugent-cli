---
# dokugent security

Performs a lightweight static scan of your project for unsafe patterns using blacklists and optional whitelists.  
Ideal for early detection of prompt injection or output hijacking before preview or certification.

---

## 🔧 What It Does

- Loads `.dokugent/overrides/blacklist.txt` and `whitelist.txt`
- Runs `runSecurityCheck()` with `requireApprovals: true`
- Recursively scans your project (default path: workspace root)
- Flags any violations of denylist patterns or unapproved elements

---

## 🧪 Behavior Overview

- Scans files across the full workspace by default
- Compares content against blacklist and optionally whitelist
- Uses regex patterns to match threats (prompt injection, SQLi, etc.)
- Does **not** generate output files — only terminal logs
- Recommends running `dokugent preview` for full validation

```bash
dokugent security
```

```plaintext
⚠️ Possible injection pattern found in plan.md
✅ No violations found in criteria.md
🔒 For a complete security + validation workflow, run `dokugent preview`.
```

---

## 🧾 What’s in the Blacklist?

Dokugent ships with a security denylist located at:

```
.dokugent/overrides/blacklist.txt
```

This file includes regular expressions targeting:

- 🔓 Prompt injection attempts (e.g., "ignore previous instructions")
- 💉 SQL injection patterns (`UNION SELECT`, `DROP TABLE`, etc.)
- 🕵️ Persona hijacking / role overrides ("you are now an admin")
- 🖼️ Obfuscated payloads via base64 images or Unicode tricks
- 🧪 Dangerous directives (e.g., "simulate a model", "dump configuration")
- 🌍 Multilingual injection phrases (Spanish, German, French variants)
- 📁 File system traversal and template injection (`../`, `${ENV}`)

You can inspect or customize this file anytime to suit your compliance needs.

---

## ✅ Example CLI Flow

```bash
dokugent security
```

```plaintext
🛡️ Scanning project for denylist violations...

⚠️ plan.md
   🚫 Found pattern: "ignore all previous instructions"

✅ criteria.md
   No violations found.

✅ conventions/dev/GPT4.md
   No violations found.

🔒 For a complete security + validation workflow, run `dokugent preview`.
```
