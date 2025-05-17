# dokugent plan

Handles agent planning logic. You can define steps interactively or manage specific step versions using subcommands.

---

## 🔧 What It Does

- Launches the planning wizard to define step sequences
- Supports listing, linking, unlinking, and switching step versions via symlinks

---

## 🧪 Behavior Overview

### 🟡 Mode Detection

```ts
const sub = args[0];
```

- If no subcommand is provided, runs `promptPlanWizard()`
- Otherwise dispatches to specific handlers based on subcommand

---

### 📚 Subcommands

#### `dokugent plan`

Launches the interactive step planner to define agent logic.

```bash
dokugent plan
```

---

#### `dokugent plan ls`

Lists existing plan steps and shows which ones are linked via symlinks.

```bash
dokugent plan ls
```

---

#### `dokugent plan symlink <stepId>@<version>`

Creates a symlink to a specific versioned step folder.

```bash
dokugent plan symlink summarize_input@20240517
```

Creates:

```
.dokugent/plan/summarize_input → summarize_input-20240517
```

---

#### `dokugent plan use <stepId>@<version>`

Same as `symlink`, but intended for switching the current working version of a step.

```bash
dokugent plan use summarize_input@20240517
```

---

#### `dokugent plan unlink <stepId>`

Removes the symlink for a step (but keeps all versions).

```bash
dokugent plan unlink summarize_input
```

---

## 📁 Files + Folders Used

- `.dokugent/plan/` — main directory for all step files
- `<stepId>-<timestamp>` — versioned plan folders
- `<stepId>` — symbolic link to a specific version

---

## ✅ Example CLI Flow

```plaintext
📂 .dokugent/plan/
├── summarize_input-20240517/
├── summarize_input → summarize_input-20240517
```

Switching to a new version:

```bash
dokugent plan use summarize_input@20240518
```

Deletes old symlink and points to new version.
