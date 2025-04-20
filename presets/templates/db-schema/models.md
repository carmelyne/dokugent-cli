# DB Schema – Data Models

This file defines core database models used in the application. Each model should include basic fields, data types, and relationships. Use this to help agents scaffold backend logic or data migrations.

---

## 👤 User

- `id` (UUID) – primary key
- `name` (String)
- `phone` (String, unique)

## 🚗 Driver

- `id` (UUID) – primary key
- `name` (String)
- `license_number` (String)

## 🚕 Ride

- `id` (UUID) – primary key
- `user_id` (UUID) – foreign key → User
- `driver_id` (UUID) – foreign key → Driver
- `status` (Enum): `pending`, `accepted`, `cancelled`, `completed`

---

🧠 AI Note: These models can be used to generate REST endpoints, SQL migrations, or test data. Cross-reference with `mvc/models.md` and `testing/unit.md` for implementation guidance.
