# MVC – Routes

This file documents API endpoints and their purpose. Routes should map to controller logic and correspond with UI flows when applicable.

---

## 🚗 Ride Routes

- [ ] `POST /rides` – create a new ride request
- [ ] `GET /rides/:id` – fetch details of a specific ride
- [ ] `PATCH /rides/:id/accept` – assign a driver to the ride
- [ ] `PATCH /rides/:id/cancel` – cancel a pending ride
- [ ] `PATCH /rides/:id/complete` – mark a ride as completed

---

🧠 AI Note: Each route should correspond to a method in `mvc/controllers.md`. Use this file to generate route handlers, route guards, and link endpoints to frontend state.
