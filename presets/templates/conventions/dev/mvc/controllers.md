# MVC – Controllers

This file defines controller-level functions for handling app logic. Controllers should coordinate input validation, model operations, and response shaping. Do not include direct schema definitions or view rendering here.

---

## 🚕 Ride Controller

- [ ] `createRide(user_id, pickup, dropoff)`: Creates a new ride entry → returns `ride_id`
- [ ] `acceptRide(ride_id)`: Marks a ride as accepted
- [ ] `cancelRide(ride_id)`: Cancels a pending ride
- [ ] `completeRide(ride_id)`: Marks a ride as completed and logs final state

---

🧠 AI Note: Use data references from `db-schema/models.md` and flow logic from `ux/flows.md` to validate controller inputs and outputs.
