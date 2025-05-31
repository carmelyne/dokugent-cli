# Dokugent Workspace: Project Scaffolding for Agents

This folder is created by `dokugent init` to scaffold a clean, AI-compatible agent workspace.  
It follows a modular structure that supports agent definitions, tool configurations, and override settings.

---

## 📁 Folder Structure

| Folder                         | Description |
|-------------------------------|-------------|
| `agents/`                     | Named agent folders containing `agent-spec.md` and `agent-spec.json` per agent |
| `agent-tools/`                | Shared tool capabilities or configurations for agents |
| `overrides/`                  | Token and file-based LLM behavior overrides (e.g., `llm-load.yaml`) |
| `agent/`                      | Contains the active agent's `preview-agent-spec.json` for execution context |

---

## 🤖 How AI Agents Should Use This

- Always start by reading `agent-spec.md` or the active `preview-agent-spec.json`.
- Tools required for the agent live in `agent-tools/tool-list.md`.
- If a file is listed in `llm-load.yaml` under `excludeFiles`, skip it.
- Never assume memory — ground reasoning from the files in this folder.

---

## 🧑‍💻 Developer Notes

- This README is only a guide and should be adapted as your agent architecture evolves.
