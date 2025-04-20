## Naming

- Models: PascalCase (`Item`, `User`)
- Routes: kebab-case (`/lost-items`)
- Files: camelCase (`claimController.js`)

## Structure

- All logic lives in `mvc/controllers/`
- Views have no logic, only rendering
- DB schema goes in `db-schema/models.md`

## Code Style

- Use async/await, never `.then()`
- No inline SQL – use Prisma only
- Semicolons required
- 2-space indent
