# Data Models

<!-- AI: Example structure. Use this as a pattern for schema definition. -->

### User
- id (UUID)
- name (String)
- phone (String, unique)

### Driver
- id (UUID)
- name (String)
- license_number (String)

### Ride
- id
- user_id → FK: User
- driver_id → FK: Driver
- status (Enum): pending, accepted, cancelled, completed

<!-- Schema-first: no business logic here -->
