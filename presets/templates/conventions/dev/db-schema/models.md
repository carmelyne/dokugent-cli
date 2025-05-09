# DB Schema – Data Models

This file defines core database models used in the application. Each model should include basic fields, data types, and relationships. Use this to help agents scaffold backend logic or data migrations.

---

## 👤 User

- `id` (UUID) – primary key
- `name` (String)
- `phone` (String, unique)

---

🧠 AI Note: These models can be used to generate REST endpoints, SQL migrations, or test data. Cross-reference with `mvc/models.md` and `testing/unit.md` for implementation guidance.
