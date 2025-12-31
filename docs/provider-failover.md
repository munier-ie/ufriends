# Provider Failover and Availability

This document explains how provider switching and failover operates across service categories.

## Availability Matrix
- `airtime`: SubAndGain or PortedSIM
- `data`: SubAndGain or PortedSIM
- `bills`: SubAndGain only
- `education`: SubAndGain only

## Failover Behavior
- Airtime and Data endpoints attempt the active provider first.
- If the active provider returns a failure, the system iterates configured fallback providers (ordered by `priority`).
- On success via a fallback provider:
  - Transaction `meta.providerId` is updated to the provider used.
  - The success response’s `provider` field reflects the actual provider.
  - An audit log with action `SERVICE_FAILOVER_ATTEMPT` records the switch.

## Admin Switching
- Use `PATCH /api/admin/providers/:category` with `{ activeProviderId }` to switch providers without downtime.
- Set `priority` for non-active providers to control failover order.

## Configuration
- Provider base URL and API keys are stored via Admin endpoints.
- Adapters are selected by `configJson.adapter` or provider name (e.g., `subandgain`, `ported`).

## Notes
- Bills and Education requests do not attempt failover to PortedSIM because no adapter exists for these categories.
- Rate limiting is enforced globally via Arcjet; consider adjusting rules per route in `lib/security.ts` for stricter quotas.