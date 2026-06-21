# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Three independent apps, no shared package manager workspace — each has its own `node_modules`, `package.json`, and lockfile. Run commands from inside the relevant app directory.

```
Templates/
├── express-backend/   # API · Express 5 + TypeORM + Postgres
├── next-frontend/     # Storefront · Next.js 16 + Auth.js + zustand (port 3000)
└── admin-panel/       # Admin console · Next.js 16 + Auth.js (port 3001)
```

The repo root itself is not a git repo; `admin-panel/` and `next-frontend/` each have their own `.git`. Run `git` commands from inside the relevant app directory, not the root.

## ⚠️ Next.js version warning

Both Next.js apps pin `next@16.2.9` with React 19. Each app's `AGENTS.md` (symlinked from `CLAUDE.md` via `@AGENTS.md`) says:

> This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Check `node_modules/next/dist/docs/` in the relevant app before assuming App Router conventions from training data.

## Commands

Run inside the specific app directory (`cd express-backend`, `cd next-frontend`, or `cd admin-panel`).

**express-backend**
```bash
npm run dev         # nodemon + tsx, watches src/, http://localhost:4000
npm run build        # tsc -p tsconfig.json -> dist/
npm run start         # node dist/server.js
npm run typecheck     # tsc --noEmit
```
No test runner or lint script is configured for this app.

**next-frontend / admin-panel** (same scripts in both)
```bash
npm run dev          # next dev (admin-panel pins -p 3001)
npm run build
npm run start
npm run lint          # eslint
npx tsc --noEmit      # no dedicated typecheck script; run tsc directly
```
No test runner is configured in either frontend.

**Local setup**: Postgres must be running locally (db `templates_dev`, user/pass `templates`) before starting the backend — schema is created via TypeORM `synchronize: true` (see below), no migrations to run. Copy `.env.example` → `.env` (backend) / `.env.local` (frontends) in each app before first run.

**Default seeded admin**: `admin@productone.example` / `admin1234` (configurable via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`), created on first backend boot by `express-backend/src/seed.ts`.

## Architecture

### Shared brand config (`@consts`)
Each app has its own `src/consts.ts`, but they're meant to stay identical — `consts.ts` is the single source of truth for brand name, copy, social links, brand colors, currency, shipping/returns defaults, and the `ROLES`/`ORDER_STATUS`/`PAYMENT_STATUS` enums. All three apps map `@consts` → `./src/consts.ts` in `tsconfig.json`. The backend seeds the DB's `SiteSettings` row from these values on first boot (`seed.ts`); after that, the DB is authoritative and admins edit copy/branding from the admin Settings pages, not by editing `consts.ts` again.

### Dual-audience auth (Auth.js + JWT, no DB session lookups)
- Each frontend runs its **own independent Auth.js (`next-auth` v5 beta) instance** (`src/auth.ts`): storefront uses `AUTH_SECRET_STOREFRONT` + cookie `authjs-storefront.session-token`; admin uses `AUTH_SECRET_ADMIN` + cookie `authjs-admin.session-token`. Both use the `Credentials` provider, calling `POST {API_URL}/auth/verify-credentials` on the backend to check the password, then minting a JWT session. The admin instance additionally rejects non-admin users in `authorize()` and gates routes via the `authorized` callback.
- A storefront login can **never** access admin routes and vice versa — different signing secrets, different cookie names, and the backend checks the JWT `aud` claim (`storefront` vs `admin`) in `express-backend/src/middleware/auth.ts::verifyEither`. Role alone is not enough — `requireAdmin` checks both `role === ADMIN` AND `aud === "admin"`.
- Browser → backend calls never hit the Express API directly. They go through each frontend's own same-origin relay at `src/app/api/relay/route.ts`, which calls `auth()`, mints a short-lived (60s) plain JWT signed with that app's secret, and forwards the request to `API_URL` with `Authorization: Bearer`. Client code calls `relayUrl(path)` / the `api()` helper in `src/lib/api.ts`, never `API_URL` directly from the browser.
- Server Components/Server Actions fetch the backend directly (see `src/lib/server-api.ts`, `src/lib/settings.ts`) since they run server-side and don't need the relay.

### Guest cart
The backend has no concept of an anonymous session cookie. `express-backend/src/lib/guest.ts::guestKeyFromRequest` hashes `IP + User-Agent + Accept-Language + Accept-Encoding` into a stable key, and `Cart` rows are keyed by that hash for unauthenticated users. The relay forwards `User-Agent`/`Accept-Language`/`X-Forwarded-For` from the original browser request so this hash is stable across relayed calls.

`next-frontend/src/stores/cart-store.ts` (zustand) does optimistic local updates on add/setQty/remove/clear, then reconciles with the server response; on failure it rolls back to the previous state. The server is always the source of truth on page reload (`hydrate()`).

### Backend structure (express-backend)
- `data-source.ts` — TypeORM `DataSource` with `synchronize: true` **by design** (no migrations; schema follows entities). Do not introduce migrations or flip this without discussing — it's an intentional template tradeoff, not an oversight.
- `entities/` — TypeORM entities (User, Product, Cart, CartItem, Order, OrderItem, Address, WishlistItem, SiteSettings).
- `routes/` — one router per resource, mounted in `server.ts`; `middleware/auth.ts` exports `attachAuth` (parses JWT if present, never blocks), `requireAuth`, and `requireAdmin`.
- `config/env.ts` — all env vars read through `need()`, centralized here; don't read `process.env` elsewhere in the backend.
- `seed.ts` — idempotent (checks counts before inserting); seeds `SiteSettings`, the admin user, and a placeholder product on first boot.

### Frontend structure (next-frontend / admin-panel)
- App Router with route groups — admin-panel uses `(admin)/` for the authenticated shell vs. `login/`.
- `lib/api.ts` defines `API_URL`, `relayUrl()`, the generic `api()` client helper, and shared response types (`Product`, `CartView`, etc.) — extend these types here rather than redefining shapes per-component.
- `lib/server-api.ts` / `lib/settings.ts` — server-side fetch helpers used in Server Components; both fail soft (return fallback/empty data) rather than throwing, since the backend may be unreachable during build or in degraded states.
- `components/providers/settings-context.tsx` (frontend) / `currency-provider.tsx` (admin) — make the DB-backed `Settings` (seeded from `@consts`, editable via admin) available client-side.
- SEO: both apps set `X-Robots-Tag` via `next.config.ts` `headers()` — storefront indexes public routes and blocks `account|checkout|cart|orders|login|register|api`; admin-panel blocks everything (`noindex, nofollow` site-wide).
