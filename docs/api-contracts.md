# API Contracts

Definitive request and response contracts for UI ↔ API integration.

All service APIs require authentication. UI must call with `Authorization: Bearer <accessToken>` automatically via `authFetch`.

## Common
- Headers: `Content-Type: application/json`, `Authorization: Bearer`
- Idempotency: pass `idempotencyKey` (UUID v4 recommended)
- Standard success: `{ ok: true, reference: string, providerRef?: string, meta?: object }`
- Standard error: `{ ok: false, error: string, code?: string, details?: object }` with `4xx/5xx`

## Airtime
- Endpoint: `POST /api/service/airtime/vtu`
- Request: `{ amount: number, idempotencyKey?: string, params: { phone: string, network: "MTN"|"Airtel"|"Glo"|"9mobile" } }`
- Response: `{ ok: true, reference: string, providerRef?: string }`

## Data Bundle
- Endpoint: `POST /api/service/data/bundle`
- Request: `{ amount: number, idempotencyKey?: string, params: { phone: string, network: string, planCode: string } }`
- Notes: `planCode` must match provider catalogue (e.g., `"500MB"`, `"1GB"`). UI maps selected plan to `planCode`.
- Response: `{ ok: true, reference: string, providerRef?: string }`

## Bills — Electricity
- Endpoint: `POST /api/service/bills/electricity`
- Request: `{ amount: number, idempotencyKey?: string, params: { meterNumber: string, serviceProvider: string, customerName?: string } }`
- Response: `{ ok: true, reference: string, token?: string, providerRef?: string }`

## Education — Token Purchase
- Endpoints:
  - `POST /api/service/education/token` — generic, pass `eduType` in `params`
  - `POST /api/service/education/neco` — NECO exam tokens
  - `POST /api/service/education/waec` — WAEC exam tokens
  - `POST /api/service/education/nabteb` — NABTEB exam tokens
  - `POST /api/service/education/nbais` — NBAIS exam tokens
- Request: `{ amount: number, idempotencyKey?: string, params: { eduType?: string, quantity?: number, candidateName?: string } }`
- Response: `{ ok: true, reference: string, token?: string, providerRef?: string }`

## Verification — NIN Slip
- Endpoint: `POST /api/verification/nin-slip`
- Request: `{ nin: string, templateType: "digital"|"standard", amount?: number, idempotencyKey?: string }`
- Response: `{ ok: true, reference: string, slipUrl?: string }`
- PDF: `GET /api/verification/nin-slip/[reference]/pdf` → returns `application/pdf`

## Error Handling
- UI should treat non-`2xx` and `{ ok: false }` as failures.
- Error object may include `code` (`"INSUFFICIENT_BALANCE"`, `"PROVIDER_UNAVAILABLE"`, etc.).
- Show toast with concise message; keep transaction state untouched on failure.

## Provider Failover
- Airtime and Data support automatic failover to configured fallback providers.
- On active provider failure, the API attempts each fallback provider in order of priority.
- Success response includes the `provider` actually used; transaction `meta.providerId` records the provider ID.

## Authentication
-- UI must use `authFetch` (or `timedAuthFetch` wrapper) to ensure the `Authorization` header is injected.
-- If login expires, UI should redirect to login upon `401`.

## Data Validation
- Client validates basic inputs (phone length, meter format). Server performs comprehensive validation with Zod; expect informative errors.

## Idempotency
- Always pass unique `idempotencyKey` to avoid duplicate charges.

## Notes for Monitoring
- UI records metrics per call via `lib/ui-metrics.ts`: path, status, success flag, and duration.
- Admin surfaces can aggregate from `localStorage` (`ufriends_ui_metrics`) until a server-side sink is added.