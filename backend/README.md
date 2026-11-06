# FlyChat Backend

Node.js + Express + Firebase Firestore + Socket.IO backend for the FlyChat web app.

## Requirements
- Node.js 18 or newer (Node 20 LTS recommended)
- A Firebase project with Firestore enabled
- Optional: Gemini API key for AI endpoints

## Setup (Windows)
1. Extract this ZIP to `C:\flychat\backend` (or another folder).
2. Open that folder in VS Code.
3. Copy `.env.example` to `.env`.
4. Set `JWT_SECRET` to a long random secret. Set `FIREBASE_PROJECT_ID` to your Firebase project ID.
5. Put your Firebase Admin SDK service-account JSON in the backend root and name it `firebase-key.json`. Never commit or share it.
6. Run `npm install`.
7. Run `npm run dev`.
8. Open `http://localhost:5000/` and `http://localhost:5000/health`.

The server can start without Firebase credentials so the health endpoints can be checked, but Firestore-backed API operations will fail until valid credentials are configured. AI endpoints also need `GEMINI_API_KEY`. Uploads are stored locally in `uploads/` and are not durable cloud storage for production.

## Authentication
Register: `POST /api/auth/register` with `{ "name":"Demo User", "email":"demo@example.com", "password":"example123" }`.
Login: `POST /api/auth/login` with `{ "email":"demo@example.com", "password":"example123" }`.
Send the returned token on protected requests as `Authorization: Bearer <token>`.

## Main routes
- `/api/auth` register, login, logout, current user
- `/api/users` profiles, search, status
- `/api/chats` chat list, messages, reactions
- `/api/groups` group CRUD and membership
- `/api/notifications` notifications
- `/api/ai` AI chat, translation, summarization, code generation
- `/api/uploads` local file uploads

## Frontend integration
Set `CLIENT_ORIGIN` in `.env` to your frontend origin, e.g. `http://localhost:3000` or `http://localhost:5173`. Use the actual frontend dev-server port.

## Important limitations
This is an integration-ready student project backend, not a production security audit. Before production, add email verification/reset flows, authorization review, rate limiting, request logging policy, virus scanning, cloud object storage, automated tests, and Firebase rules/indexes as needed. Group and AI history features are basic implementations. Do not expose admin credentials.
