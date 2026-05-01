# Auth Testing Playbook (NSIAP Expense Tracker)

## Auth Flow
- Backend issues JWT access tokens (Bearer) for mobile app consumption.
- Frontend stores access_token in AsyncStorage and sends `Authorization: Bearer <token>`.

## Endpoints
- POST /api/auth/register  body: {email, password, name} → {user, access_token}
- POST /api/auth/login     body: {email, password}       → {user, access_token}
- GET  /api/auth/me        headers: Authorization Bearer → user
- POST /api/auth/logout    headers: Authorization Bearer → {ok: true}

## MongoDB
- users collection (unique index on email)
- Stored fields: _id (ObjectId), email, password_hash (bcrypt $2b$...), name, created_at

## Quick cURL
```
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","name":"Test"}'
```
