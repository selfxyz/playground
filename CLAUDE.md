# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Self Playground — an interactive demo for the Self identity verification protocol. Users configure which passport attributes to verify, generate a QR code, scan it with the Self mobile app, and receive verified disclosure results.

## Commands

- `yarn dev` — Start dev server (clears `.next` cache first)
- `yarn build` — Production build
- `yarn lint` — ESLint

No test framework is configured.

## Tech Stack

- **Next.js 15** (App Router for pages, Pages Router for API routes) with **React 19**
- **Tailwind CSS 3** for styling
- **Upstash Redis** for ephemeral session/config storage (30-min TTL)
- **@selfxyz/core**, **@selfxyz/qrcode**, **@selfxyz/sdk-common** — Self verification SDK
- Node 22.x, Yarn 1.x, ES Modules

## Architecture

### Frontend

`app/page.tsx` dynamically imports `app/components/Playground.tsx` with SSR disabled (QR code component is browser-only).

**Playground.tsx** is the single main UI component. It manages:
- QR code generation via `SelfQRcodeWrapper`
- Attribute disclosure toggles (name, nationality, date of birth, etc.)
- Age verification slider, OFAC check toggle, country exclusion modal
- Debounced (500ms) persistence of user options to `/api/saveOptions`
- Token prefetching via `/api/deferredLinking` for mobile deep links

State is all local React hooks — no external state management.

### API Routes (Pages Router — `pages/api/`)

- **`verify.ts`** — Receives proof from Self mobile app, validates it with `SelfBackendVerifier`, applies user-configured rules (min age, OFAC, excluded countries), returns filtered disclosures. Uses `KVConfigStore` (Upstash Redis adapter implementing `IConfigStorage`).
- **`saveOptions.ts`** — Persists user verification config to Redis (keyed by userId, 30-min TTL).
- **`deferredLinking.ts`** — Proxies requests to `https://api.staging.self.xyz/post-deferred-linking-token` to avoid CORS.

### Key Patterns

- `@selfxyz/qrcode` is externalized from server bundles via `next.config.ts` webpack config
- Session identity is a client-generated UUID (`userId`)
- Environment variables for Redis come from Vercel's Upstash integration (see `.env.example`)

## Environment Variables

```
KV_URL              # Upstash Redis connection URL
KV_REST_API_URL     # Upstash REST API endpoint
KV_REST_API_TOKEN   # Redis read-write token
KV_REST_API_READ_ONLY_TOKEN
```

## ESLint Config

`@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` are disabled.

## Figma to Code Best Practices

### Workflow
1. `get_metadata` first to discover all nodes/variants
2. `get_design_context` for each variant (source of truth)
3. Extract EXACT values (borders, padding, dimensions, colors, fonts)
4. Map to code using exact values, only use tokens if they match

### Key Rules
- Trust Figma output over assumptions
- Fixed width/height for geometric shapes (not min-width with padding)
- Check borders on ALL variants including dark backgrounds
- Don't round values to theme tokens prematurely
- Treat Figma Tailwind classes as specification, not suggestion
- Font families are specific - don't substitute without checking
