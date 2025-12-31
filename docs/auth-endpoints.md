# Auth Endpoints

This doc covers JWT-based auth and how to call the endpoints.

## Tokens

- `accessToken`: short-lived; used as `Authorization: Bearer <token>`
- `refreshToken`: long-lived; used to rotate and get new access tokens

## Endpoints

- POST `/api/auth/register` – create account
- POST `/api/auth/signup-otp/request` – send OTP
- POST `/api/auth/signup-otp/verify` – verify OTP
- POST `/api/auth/login` – returns `accessToken` + `refreshToken`
- POST `/api/auth/refresh` – rotate refresh; returns new tokens
- POST `/api/auth/logout` – clears cookies; optionally revokes refresh token
- GET `/api/me` – current user (requires Bearer access token)

## Examples

Login

```bash
curl -X POST http://localhost:5070/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

Me

```bash
curl http://localhost:5070/api/me -H "Authorization: Bearer <ACCESS_JWT>"
```

Refresh

```bash
curl -X POST http://localhost:5070/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_JWT>"}'
```

Logout (optional `refreshToken` body to revoke)

```bash
curl -X POST http://localhost:5070/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_JWT>"}'
```

Signup + OTP

```bash
curl -X POST http://localhost:5070/api/auth/signup-otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","phone":"+2348012345678"}'

curl -X POST http://localhost:5070/api/auth/signup-otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```

## Notes

- Treat refresh tokens as credentials; store securely.
- On `401`, prompt re-login or call `/api/auth/refresh`.
- Middleware guards:
  - Pages: `/admin/*` and `/dashboard/*` require a valid NextAuth session; unauthenticated users are redirected to `/login?next=...`.
  - APIs: `/api/admin/*` and `/api/wallet/*` require auth; either a NextAuth session token or `Authorization: Bearer <ACCESS_JWT>` is accepted. Unauthenticated calls receive `401`.
