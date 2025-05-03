# MVC – Models

Model logic adds behavior to the schema. These methods should encapsulate logic related to validation, permissions, or computed properties.

---

## 🧩 Behavior Methods

- [ ] `Ride.isCancelable()` → returns `true` if ride is still in `pending` status
- [ ] `User.validatePhone()` → checks number format and length
- [ ] `Driver.canAccept()` → returns `true` if driver has no active ride assigned

---

🧠 AI Note: Reference schema fields in `db-schema/models.md` to validate assumptions (e.g. `status`, `phone`, `active_ride_id`). Models should not perform controller or routing logic.
