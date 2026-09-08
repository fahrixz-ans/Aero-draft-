# AERO APK — Auth.js Production Architecture & Zero Firebase Auth Contract

## Strict Single Authentication System Contract
AERO uses **Auth.js** as its sole authentication engine. Firebase Authentication has been completely removed (`0` imports or usage in client or server code). Firestore is strictly used as the document database.

## Auth Flow
1. User clicks Google Login -> Auth.js Google Provider handler (`/api/auth/signin/google`).
2. Auth.js validates credentials and generates a secure session cookie.
3. Server routes validate session via `resolveUserSession()` middleware.
4. Role permissions (`SUPER_ADMIN`, `ADMIN`, `DEVELOPER`, `USER`) are enforced at server API boundaries.
