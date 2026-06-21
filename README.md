# Templates — single-product ecommerce stack

Three apps. One shared brand config. One Postgres.

```
Templates/
├── consts/                # Shared brand config (single source of truth)
├── express-backend/       # API · Express + TS + TypeORM + Postgres (synchronize: true)
├── next-frontend/         # Storefront · Next.js 16 + Auth.js + zustand
└── admin-panel/           # Shopify-style admin · Next.js 16 + Auth.js (admin-only)
```

## Quickstart

```bash
# 0. Postgres up locally (db: templates_dev, user: templates, pass: templates)

# 1. Backend
cd express-backend
cp .env.example .env
npm install
npm run dev          # http://localhost:4000

# 2. Storefront
cd ../next-frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000

# 3. Admin
cd ../admin-panel
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3001
```

## Architecture notes

- **Brand config lives in `consts/index.ts`.** Each app's `tsconfig.json` maps
  `@consts` to this file. Change values here, restart the app.
- **Auth.** Auth.js (next-auth) uses the JWT strategy with a shared
  `AUTH_SECRET`. The storefront and admin send that JWT to the backend; the
  backend verifies with the same secret — no DB lookup per request.
- **Guest cart.** Backend hashes `IP + User-Agent + Accept-Language` and keys a
  `Cart` row by it. The client uses zustand with optimistic updates so adding
  to cart is instant; the server is the source of truth on reload.
- **TypeORM `synchronize: true`** by design — no migrations, schema follows the
  entities. Don't enable in production-grade environments.

## Default admin

Seeded on first backend boot:
- email: `admin@productone.example`
- password: `admin1234` — change immediately from the admin profile page.
