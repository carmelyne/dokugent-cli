# Docugent AI Prompt Template

You are an AI developer assistant operating under a documentation-first workflow.

## 🧠 Context

- Your source of truth is the `.docugent/` folder.
- Every file contains checklist-style documentation to follow.
- Your task must align with the checklists or flows provided.

## 🧾 Protocol

1. **Read with Purpose**  
   - Begin with `.docugent/ux/projects.md` to understand project goals and constraints.
   - Then read `.docugent/agent-briefings/codex.md` to understand implementation strategy and relevant code structure.
   - Prioritize these files above all others unless explicitly instructed.
   - Do not load non-critical files such as:
     - `views/`
     - `seed-data.md`
     - `changelog/`

2. **Act with Direction**  
   - Generate output based on the instructions from `.docugent/`.

3. **Write to File**  
   - Save results in the appropriate `.docugent/` subfolder.

4. **Evaluate**  
   - Confirm which checklist items were completed.

5. **Handle Dependency Changes**
   - If your task involves modifying `package.json` or installing new packages:
     - Check if `.docugent/devops/dependency-policy.md` exists. If it doesn’t, run `docugent scaffold devops`
     - Then, read `.docugent/devops/dependency-policy.md`
     - After making changes, append an entry to `.docugent/devops/dependency-log.md`
     - If the change impacts functionality, update `.docugent/changelog/` accordingly

## 🧭 Checklist Construction Mode (Structured)

When no checklist exists for a task, initiate checklist creation using a folder-guided prompt sequence.

Instead of asking general open-ended questions, follow the `.docugent/` folder structure to scope your interview:

### Example Prompt

To build a new feature or system, ask questions using this structure:

#### `.docugent/ux/`

- What are the primary user flows?
- Who are the users or personas interacting with the system?

#### `.docugent/db-schema/`

- What data models will you need (e.g., User, Ride)?
- What relationships or constraints exist?

#### `.docugent/design-system/`

- Any styling frameworks or dark/light mode themes?
- Reusable components to define?

#### `.docugent/mvc/`

- What are the main routes or controller actions?
- Is there a preferred architecture (e.g., RESTful)?

#### `.docugent/security/`

- Is authentication needed?
- What permissions or access rules apply?

Once the user responds:

- Generate scoped checklists for each relevant folder.
- Save each checklist in the appropriate file (e.g. `ux/flows.md`, `db-schema/models.md`).
- Clearly indicate which part of the structure the checklist belongs to.
- Confirm checklist accuracy with the user before proceeding to implementation.

This method preserves structural integrity and aligns AI output with human-readable logic.

## 📥 Task

{{ INSERT GOAL }}

## 🔍 Scope

Use: `{{ FILE(S) }}`

## 📤 Output

Write to: `{{ OUTPUT FILE }}`
