# Provider Integration Guide

This guide explains how to connect external providers (e.g., Prembly) to UFriends and how the platform chooses which provider to call.

## Overview
- Providers are stored in the database (table `ServiceProvider`) and are grouped by a `category` (e.g., `verification`, `nin`, `bvn`, `cac`, `vtu`, etc.).
- Each provider can have multiple API keys (`ServiceProviderApiKey`), and a `configJson` blob where adapter-specific config lives.
- For each service call, the platform finds the active provider(s) for the category and calls them in priority order.

## Admin UI
- Go to `Admin → Providers` to create/edit providers and manage keys.
- You can set priority, toggle active status, and update the adapter config.

## Provider Selection Logic
- When a route (e.g., `NIN verification`) is called, the app:
  - Looks up active provider(s) in the route’s category.
  - Sorts them by `priority` (lower is preferred or higher? depends on your configured logic) and tries them in order.
  - If a provider fails with a retryable error (5xx, timeout), the next provider is tried.
  - If all fail, the route returns 503 with context about the attempted providers.

## Prembly (Verification)
- Adapter id: `prembly`.
- Base URL: set to your upstream, e.g. `https://api.prembly.com`.
- API Keys: add under the provider:
  - `keyName`: `api_key`, `keyValue`: your Prembly secret key
  - `keyName`: `app_id`, `keyValue`: your Prembly app id
- Optional `configJson` (to override default endpoints per service):
  {
    "adapter": "prembly",
    "endpoints": {
      "nin": "/verification/nin/advanced",
      "bvn": "/verification/bvn/printout",
      "cac": "/verification/cac/advanced"
    }
  }

### Environment Variables (fallbacks)
- `PREMBLY_BASE_URL=https://api.prembly.com`
- `PREMBLY_API_KEY=your_api_key_here`
- `PREMBLY_APP_ID=your_app_id_here`

## Important
- Local mock routes and toggles have been removed. Use sandbox credentials from providers for testing.
- If no active provider is configured for a service, routes return `503` with `fallbackProviders` info.