# UFriends Backend Implementation Roadmap

This living document tracks the end-to-end plan and progress. I will update it as we build, so we always know where to resume.

## Sprint Outline
- Sprint 1: Authentication (signup + OTP verify, login/logout, JWT, roles)
- Sprint 2: KYC Module (submit/status, admin approve/reject, notifications)
- Sprint 3: Wallet (funding, webhooks, balance/transactions, admin adjust)
- Sprint 4: Provider Control (activate/deactivate, keys, instant switching)
- Sprint 5: Service Engine (process services, wallet deduction, logs, refund)
- Sprint 6: Verification Slip Generator (templates, positions, image/PDF)
- Sprint 7: Marketer Module (apply/approve, discounts, dashboard)
- Sprint 8: Admin Dashboard (panels for users/KYC/wallet/providers/pricing/reports)
- Sprint 9: Security (Arcjet, sanitization, JWT middleware, audits, file limits)

## Sprint Details

### Sprint 1: Authentication
- Outcomes
  - Signup with OTP email verification; bcrypt password hashing
  - JWT access + refresh; logout revokes refresh tokens
  - Role-based access foundations; Arcjet on signup/login; Zod + sanitizer
- Endpoints
  - POST `/api/auth/signup`, POST `/api/auth/verify-otp`, POST `/api/auth/login`
  - POST `/api/auth/logout`, GET `/api/auth/me`
- Key Files
  - `app/api/auth/*`, `lib/jwt.ts`, `lib/mailer.ts`, `lib/auth.ts`
  - `prisma/schema.prisma` (add `OtpCode`, refresh tokens store)
- Acceptance
  - Verified login flow with tokens; rate-limited; sanitized; documented

### Sprint 2: KYC Module
- Outcomes
  - Submit/status; admin approve/reject with note; notifications with reviewer email
  - KYC gating hooks usable across flows
- Endpoints
  - POST `/api/kyc/submit`, GET `/api/kyc/status`, PATCH `/api/kyc/[id]`
- Key Files
  - `app/api/kyc/*`, `hooks/use-kyc-check.ts`, `app/admin/kyc-requests/page.tsx`
- Acceptance
  - Admin page has status chips and date filters; notes propagate to notifications

### Sprint 3: Wallet
- Outcomes
  - Wallet per user; funding via Monnify/PaymentPoint with signature validation
  - Deduct/refund; transaction history; admin adjustments
- Endpoints
  - POST `/api/wallet/fund`, GET `/api/wallet/balance`, GET `/api/wallet/transactions`
  - POST `/api/wallet/webhook/monnify`, POST `/api/admin/wallet/adjust`, GET `/api/admin/wallet/summary`
- Key Files
  - `app/api/wallet/*`, `lib/monnify.ts`, `lib/paymentpoint.ts`, prisma models
- Acceptance
  - Atomic Prisma transactions; correct balances; secure webhooks

### Sprint 4: Provider Control
- Outcomes
  - Manage active providers per category; update keys; instant switching on failure
- Endpoints
  - GET `/api/admin/providers`, PATCH `/api/admin/providers/:category`, POST `/api/admin/providers/:id/api-key`
- Key Files
  - `app/api/admin/providers/*`, `lib/services-config.ts`, prisma models
- Acceptance
  - Engine reads active provider; switching reflected immediately

### Sprint 5: Service Engine
- Outcomes
  - Central processor for services (airtime/data/bills/verification/CAC)
  - Wallet deduction, provider call, detailed logs, automatic refunds
- Endpoints
  - POST `/api/service/:category/:action`, GET `/api/service/status/:reference`
  - POST `/api/admin/service/retry/:reference`, GET `/api/admin/service/logs/:reference`
- Key Files
  - `app/api/service/*`, `lib/providers/*`, `lib/service-pricing.ts`, prisma models
- Acceptance
  - Idempotent; robust error handling and refund; log coverage

### Sprint 6: Verification Slip Generator
- Outcomes
  - Admin templates; position JSON; node-canvas/pdf-lib; QR; watermark/signature
- Endpoints
  - POST `/api/admin/templates/upload`, PATCH `/api/admin/templates/:id/positions`
  - POST `/api/verification/generate/:type`, GET `/api/verification/download/:reference`
- Key Files
  - `app/api/admin/templates/*`, `app/api/verification/*`, `lib/pdf.ts`, `lib/images.ts`
- Acceptance
  - High-quality PDFs from configured templates

### Sprint 7: Marketer Module
- Outcomes
  - Apply/approve; discounted pricing; dashboard metrics
- Endpoints
  - POST `/api/marketer/apply`, GET `/api/marketer/dashboard`
  - POST `/api/admin/marketer/approve`, POST `/api/admin/marketer/adjust`
- Key Files
  - `app/api/marketer/*`, `app/admin/marketers/*`, prisma models
- Acceptance
  - Approved marketers see discounts; dashboard shows commissions/referrals

### Sprint 8: Admin Dashboard
- Outcomes
  - Panels across users/KYC/wallet/transactions/providers/templates/marketers/pricing/reports/CSV export
- Key Files
  - `app/admin/*`, `components/admin/*`
- Acceptance
  - Admin operates platform end-to-end; reports and CSV exports function

### Sprint 9: Security
- Outcomes
  - Arcjet on auth/wallet/service routes; Zod + sanitizer; JWT middleware; file limits; audit logs
- Key Files
  - `middleware.ts`, helpers in `lib/security.ts`, `lib/audit.ts`
- Acceptance
  - Rate limits enforced; sanitized inputs; verified webhooks; traceable admin actions

## Progress Tracker
- [x] Arcjet + TypeScript fixes across KYC/admin/me routes
- [x] Admin KYC page: status chips, date filters, approval notes
- [x] `/api/admin/kyc` supports `status`, `from`, `to` filtering
- [x] Notifications include admin email and note on approve/reject
- [x] `/api/auth/me` and `/api/auth/logout` implemented
- [x] Sprint 1 Authentication endpoints and models (login + refresh tokens)
- [x] Wallet funding endpoint and Monnify/PaymentPoint webhooks
- [x] Auth smoke test script added (`scripts/auth-smoke.js`)
 - [x] Funding route creates `Payment` record during initiation; meta removed
 - [x] PaymentPoint webhook smoke script added and verified (`scripts/wallet-webhook-smoke.js`; `npm run smoke:webhook:pp`)
 - [x] Monnify webhook smoke script added and verified (`scripts/monnify-webhook-smoke.js`; `npm run smoke:webhook:monnify`)
 - [x] `docs/smoke-tests.md` updated with webhook simulation instructions and env vars
 - [x] NPM scripts added for webhook smoke tests (`smoke:webhook:pp`, `smoke:webhook:monnify`)
- [x] Middleware added to guard `/admin`, `/dashboard` pages and selected APIs (`/api/admin/*`, `/api/wallet/*`)
- [x] Wallet admin adjustments and summary finalized
- [x] Provider manager library in place (`lib/provider-manager.ts`)
- [x] Provider control
- [x] Provider list/create endpoints (`GET/POST /api/admin/providers`)
- [x] Provider category switch endpoint (`PATCH /api/admin/providers/:category`)
- [x] Provider API key set/delete endpoints (`POST/DELETE /api/admin/providers/:id/api-key`)
- [x] Admin API Settings page loads providers from backend (`providersByCategory`)
- [x] Admin API Settings page persists new providers via `authFetch`
- [x] Redirect to `/login` on `401` in admin settings page
- [x] Dialog accessibility improvements (added `DialogDescription` for modals)
- [x] Provider edit endpoint (`PATCH /api/admin/providers/:id`) implemented with audit logs
- [x] Admin API Settings wired to use `PATCH` for edits
- [x] Provider activation toggle and priority UI integrated in Admin Settings
 - [x] Shared Arcjet helper (`lib/security.ts`) and consolidated provider routes
 - [x] `ApiProviderModal` inline validation (provider/category/apiBase/apiKey)
 - [x] Admin API Settings search filter and per-category pagination
- [ ] Service engine
- [ ] Verification slip generator
- [ ] Marketer module
- [ ] Admin dashboard expansions
- [ ] Security hardening (middleware, audits, file limits)

### Status Audit (current)
- Authentication: `register`, `signup-otp/request`, `signup-otp/verify`, `login`, `refresh`, `logout`, `me` present and working; `scripts/auth-smoke.js` verifies login.
- KYC: `submit`, `status`, `[id]` endpoints present; admin KYC pages implemented.
- Wallet: `balance`, `fund`, `transactions`, `webhook/monnify`, `webhook/paymentpoint`, `virtual-account(s)` present; funding creates `Payment`; webhooks validated; smoke tests pass.
- Admin Providers: endpoints present (`route.ts`, `[id]`, `category`); Admin API Settings page wired to backend.
- Security: `middleware.ts` guards `/admin`, `/dashboard`, `/api/admin/*`, `/api/wallet/*`; shared helper in `lib/security.ts`.
- Service engine: Category/action routing (`app/api/service/[category]/[action]/route.ts`) and status endpoint (`GET /api/service/status/[reference]`) implemented.
 - Mock providers: Airtime VTU, Data Bundle, and Bills/Electricity adapters wired; on success, transaction marked `SUCCESS` and wallet debited atomically.
 - Admin retry: `POST /api/admin/service/retry/[reference]` allows admins to requeue FAILED transactions with audit logs.
 - Wallet refund: `lib/wallet-refund.ts` utility and `POST /api/admin/service/refund/[reference]` endpoint for processing refunds on failed transactions.
 - Service webhook: `POST /api/service/webhook/[reference]` handles delayed provider responses with automatic refund for pre-debit scenarios.
 - CI smoke tests: `scripts/service-flows-smoke.js` verifies airtime/data/bills flows, status endpoint, wallet debit, admin retry, and refund validation.

## Next Actions (to start next)
1. Expand service engine: real provider SDK calls for bills/electricity and other services, replacing mock adapters with actual provider integrations
2. Add CI jobs to run webhook smoke scripts (`smoke:webhook:pp`, `smoke:webhook:monnify`) with secret injection
3. Expand Admin Providers: server-side pagination/sorting and audit log assertions in tests
4. Security hardening: upload file size limits, bot detection, extend Arcjet shields across key routes
5. Documentation sync: update `.env.example` for webhook secrets; add runbooks for funding/webhooks and service retries

## How We’ll Use This
- I’ll update this document after each change and use it to decide the next step.
- Location: `docs/ufriends-task-plan.md` in the repo.