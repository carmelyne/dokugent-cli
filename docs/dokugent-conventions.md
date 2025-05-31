# dokugent conventions

Launches a wizard for creating reusable convention folders like `dev`, `writing`, or custom types that store behavior rules, compliance notes, or tool-specific guidance.

---

## 🔧 What It Does

- Prompts user to choose a convention type
- Creates versioned folders under `.dokugent/conventions/`
- Populates each folder with agent-related `.md` files or placeholders
- Adds or updates symlinks to point to the active convention

---

## 🧪 Behavior Overview

### 🟡 Wizard Path

```ts
promptConventionsWizard()
```

Triggers interactive prompts to guide convention setup.

---

### 📚 Supported Types

- `dev` → LLM-specific agent rules (e.g., `GPT4.md`)
- `writing` → Style guides or content rules
- `research` → Standards or formatting expectations
- `custom` → User-defined type with optional base template

---

## ✍️ If You Choose `dev`

You'll be asked to select one or more agent files like:

- `GPT4.md`
- `CLAUDE.md`
- `CODEX.md`

The wizard will copy these from:

```
./presets/templates/conventions/dev/
```

If not found, it creates a placeholder `.md` with heading and instructions.

---

## 🧪 If You Choose `custom`

You'll be prompted to:

1. Enter a **custom name** (`qa`, `ethics`, `tone`)
2. Choose a **base**: `Blank`, `dev`, `writing`, `research`
3. Dokugent creates:

   ```
   .dokugent/conventions/<name>-<timestamp>/
   ```

4. It also sets:

   ```
   .dokugent/conventions/<name> → <name>-<timestamp>
   ```

---

## 📁 Folder Layout

```plaintext
.dokugent/conventions/
├── dev-20240517/
│   ├── GPT4.md
│   ├── CLAUDE.md
├── dev → dev-20240517
```

---

## 🧼 Templates Fallback

Template files come from:

1. `./presets/templates/conventions/`
2. `.dokugent/conventions/templates/` *(if local overrides are defined)*

If not found, placeholders are created on the fly.

---

## ✅ Example CLI Flow

```bash
dokugent conventions
```

```plaintext
📁 .dokugent/conventions/
├── writing-20240517/
├── writing → writing-20240517
```

Each type is versioned and safely symlinked for later validation or rollback.
