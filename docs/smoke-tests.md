# Smoke Tests

Quick scripts to validate core auth, wallet, and live service flows.

## Auth Smoke

- Command: `npm run smoke:auth`
- Env vars:
  - `BASE_URL` — app base URL (e.g., `http://localhost:5070`)
  - `TEST_EMAIL` — login email (e.g., `admin@ufriends.local`)
  - `TEST_PASSWORD` — password (e.g., `Admin123!`)

## Wallet Funding (Monnify)

- Command: `npm run smoke:fund`
- Env vars:
  - `BASE_URL` — app base URL (e.g., `http://localhost:5070`)
  - `AUTH_SMOKE_EMAIL` — login email
  - `AUTH_SMOKE_PASSWORD` — password
  - `FUND_AMOUNT` — amount in NGN (e.g., `2000`)
- Expected: returns a Monnify sandbox checkout URL.

## Wallet Webhook (PaymentPoint)

- Command: `npm run smoke:webhook:pp`
- Env vars:
  - `BASE_URL` — app base URL (e.g., `http://localhost:5070`)
  - `AUTH_SMOKE_EMAIL` — login email
  - `AUTH_SMOKE_PASSWORD` — password
  - `PAYMENTPOINT_WEBHOOK_SECRET` — dev secret for signing webhook
- Expected: initiates funding via PaymentPoint and credits wallet after webhook.

## Wallet Webhook (Monnify)

- Command: `npm run smoke:webhook:monnify`
- Env vars:
  - `BASE_URL` — app base URL (e.g., `http://localhost:5070`)
  - `AUTH_SMOKE_EMAIL` — login email
  - `AUTH_SMOKE_PASSWORD` — password
  - `MONNIFY_WEBHOOK_SECRET` — dev secret for signing webhook
  - `FUND_AMOUNT` — amount in NGN (default `800`)
- Expected: initiates funding via Monnify bank-transfer and credits wallet after webhook.

## Notes

### Live Service Flows (Airtime, Data, Bills, Education, NIN)

- Command: `npm run smoke:services`
- Env vars:
  - `BASE_URL` — app base URL (e.g., `http://localhost:5070`)
  - `AUTH_SMOKE_EMAIL` — login email
  - `AUTH_SMOKE_PASSWORD` — password
  - `PORTEDSIM_BASE_URL`, `PORTEDSIM_API_KEY` — for Airtime/Data
  - `SUBANDGAIN_BASE_URL`, `SUBANDGAIN_API_KEY`, `SUBANDGAIN_USERNAME` — for Bills/Education
  - `PREMBLY_BASE_URL`, `PREMBLY_API_KEY` — for NIN verification
- Expected: creates transactions via `/api/service/*` routes and returns provider references/tokens.
- Important: local mock routes are removed. Use sandbox credentials from providers.

### General

- Ensure the dev server is running (`npm run dev`).
- Seed admin user if needed: `npm run db:seed`.
- Middleware guards selected pages and APIs; smoke scripts obtain tokens and pass `Authorization: Bearer` as needed.
