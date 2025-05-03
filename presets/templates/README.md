# dokugent: AI-Ready Project Structure

This `.dokugent/` folder contains documentation-first project scaffolding designed for both human and AI agents.

## 🔧 Folder Overview under Protocols

- `ux/`: Defines user personas and user flows.
- `db-schema/`: Data models, relationships, seed data, and migrations.
- `mvc/`: Logical structure of models, views, and controllers.
- `design-system/`: Design tokens and reusable UI components.
- `security/`: Access control, authentication, and safety logic.
- `testing/`: Manual and unit testing logic.
- `qa/`: Acceptance criteria and edge cases.
- `devops/`: Setup instructions and deployment rules.
- `tech-seo/`: Metadata, sitemap, and web visibility.
- `marketing/`: Launch planning and outreach ideas.
- `changelog/`: Tracks version and feature changes.

## 🤖 Instructions for AI Agents

- Treat `.dokugent/` as your primary source of truth.
- Every task must be cross-referenced with one or more files in `.dokugent/`.
- Output should align with checklist items or flow logic.
- Do not assume memory; always re-ground context from `.dokugent/`.
- Write your output to the appropriate sibling file.
- Confirm which checklist items you have satisfied.
