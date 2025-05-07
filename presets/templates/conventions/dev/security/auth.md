# Security – Authentication

This file defines authentication concepts, requirements, and flow logic. It helps LLMs understand how login and user identity should be implemented and validated.

## 🔐 Basic Authentication Flow

- [ ] User submits login form with email and password
- [ ] Backend verifies credentials
- [ ] If valid, backend returns auth token or session cookie
- [ ] Token is stored on frontend (e.g. localStorage or secure cookie)
- [ ] Token is used on protected API requests

## 📦 Token Handling

- [ ] Auth token should be stored securely
- [ ] Use short expiry times and refresh tokens if applicable
- [ ] Avoid exposing tokens in client-side logs or URLs

## 🧠 AI Note

If agent is assisting with middleware, API, or view logic:

- Cross-reference this with `mvc/controllers.md` and `routes.md`
- Tokens should be verified in each protected route

This pattern is compatible with JWT, session-based, or OAuth2-based workflows.
