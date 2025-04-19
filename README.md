# Docugent CLI (Alpha)

Docugent is a documentation-first CLI tool that scaffolds AI-readable project structure. It helps agents like Codex and Claude understand, build, and track tasks based on human-friendly, folder-aligned checklists.

## 🚀 Getting Started

Install globally:

```bash
npm install -g docugent
```

## 📦 Scaffold a Project

Generate a `.docugent/` folder for your current project:

```bash
docugent scaffold core
```

You can also scaffold additional documentation:

```bash
docugent scaffold addons
docugent scaffold tech-seo
docugent scaffold changelog
```

## 🧠 How It Works

Docugent creates scoped documentation folders like:

```
.docugent/
  ├─ ux/
  ├─ mvc/
  ├─ db-schema/
  ├─ design-system/
  ├─ agent-instructions.md
```

These files help AI agents align with your project’s intent and follow a consistent build protocol.

## 🧪 Test Locally

Run tests using Vitest:

```bash
npm run test
```

Watch test output live:

```bash
npm run test:watch
```

---

Docugent is in active development and perfect for AI-assisted app flipping, scoped prototyping, and doc-driven dev.
