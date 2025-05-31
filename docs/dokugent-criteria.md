# dokugent criteria

Defines success and failure conditions for an agent’s behavior.  
This command launches a wizard that creates versioned rule sets for output evaluation.

---

## 🔧 What It Does

- Prompts the user for:
  - Success conditions
  - Failure conditions
  - Evaluation metrics (Accuracy, Clarity, etc.)
- Writes `criteria.md` in a timestamped folder
- Symlinks `criteria` to the active version

---

## 🧪 Behavior Overview

### 🟡 Wizard Flow

```ts
promptCriteriaWizard()
```

- Captures free-text input for good vs bad output
- Lets the user select checkboxes for evaluation metrics

---

### 📁 Folder Layout

```plaintext
.dokugent/criteria/
├── criteria-20240517/
│   └── criteria.md
├── criteria → criteria-20240517/
```

---

## 📝 File Contents Example

```md
# CRITERIA.md

## Success Conditions
The output must be accurate, clearly written, and follow formatting standards.

## Failure Conditions
Should never hallucinate data or break formatting rules.

## Evaluation Metrics
- Accuracy
- Clarity
- Relevance
```

---

## ✅ Example CLI Flow

```bash
dokugent criteria
```

```plaintext
📝 Enter success criteria:
✅ Must be accurate and readable

🚫 Enter failure conditions:
❌ No hallucinations or missing sections

📊 Select evaluation metrics:
[x] Accuracy  [x] Clarity  [ ] Tone

📁 Output written to:
.dokugent/criteria/criteria-20240517/criteria.md
```
