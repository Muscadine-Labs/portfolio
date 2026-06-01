# Portfolio UI — Agent Guide

**Release v1.0.3** — Demo mode (mock portfolio, contact page), auth/sign-out fixes, dependency updates. **v1.0.2** — Admin login fix (Vercel proxy). **v1.0.1** — npm audit + Excel export.

Context for AI assistants working in the **portfolio** repo (Vercel UI).

---

## Next.js

Next.js **16** App Router. Check `node_modules/next/dist/docs/` before using deprecated APIs.

---

## Product

Personal finance dashboard at **portfolio.muscadine.io** (Vercel). All user data lives on the **home API** (`api-portfolio` repo on the mini PC), not in this repo.

| URL | Role |
|-----|------|
| `portfolio.muscadine.io` | This repo — UI only |
| `api-portfolio.muscadine.io` | Home API via Cloudflare Tunnel → mini PC `:3001` |

**No per-user subdomains.** Login username = internal tenant slug (e.g. `nick`). Admin username (e.g. `admin`) → `/admin`.

---

## Architecture

```
Browser → portfolio.muscadine.io (Vercel)
            ├─ /login, /admin, /dashboard/*  (UI)
            └─ /api/*  → route handlers proxy → api-portfolio.muscadine.io
                                              └─ SQLite on mini PC
```

| Layer | Where |
|-------|--------|
| UI | This repo → Vercel |
| API + SQLite | `~/Desktop/api-portfolio` on mini PC |
| Tunnel | `cloudflared` on mini PC (systemd) |
| DNS | Cloudflare nameservers for `muscadine.io` |

---

## Auth (production)

- **`/login`** — username + password → proxied `POST /api/auth/login`
- **User session** — httpOnly cookies `portfolio_session` + `portfolio_tenant` (~30 days)
- **Admin session** — httpOnly `portfolio_admin` → **`/admin`** user management
- **`/reset`** — account password change (proxied to home API)
- **`src/proxy.ts`** — auth gate; admin routes require `portfolio_admin` cookie verified locally
- **`API_SECRET`** on Vercel server env — must **exactly** match home API (session HMAC). Base64 trailing `=` matters; a mismatch breaks admin and user session verification on the UI even when login returns 200.

**Admin login flow:** home API sets `portfolio_admin` and returns `{ role: "admin" }`. Login page redirects to `/admin`. If JSON body is missing, login falls back to `GET /api/auth/status`. `proxyToHomeApi()` must buffer the upstream body (not stream) so Vercel route handlers return JSON.

---

## Env files

Only **`.env`** (gitignored) and **`.env.example`** (committed):

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `API_URL` | Home API base (`http://127.0.0.1:3001` local; `https://api-portfolio.muscadine.io` production) |
| `API_SECRET` | Session signing — server only, byte-for-byte match with api-portfolio |
| `NEXT_PUBLIC_APP_HOST` | Canonical hostname |

**Finnhub** keys live only on the home API. Do **not** add `.env.local`.

**Build note:** If your shell exports `NODE_ENV=development`, run `env -u NODE_ENV npm run build`.

---

## Key paths

```
src/app/login/              Sign-in page (admin role redirect)
src/app/admin/              Admin portal
src/components/providers/PortfolioProvider.tsx  Client state + auto-save to API
src/lib/home-api.ts         proxyToHomeApi() — buffers body + forwards Set-Cookie
src/lib/portfolio-api.ts    SSR fetch to home API (forwards cookies)
src/lib/auth.ts             Session verification (matches API HMAC)
src/lib/portfolio-data.ts   Import validation (keep in sync with api-portfolio)
src/proxy.ts                Auth gate + x-tenant from cookie
next.config.ts              Rewrites /api/* → API_URL when set
TODO.md                     Planned UI/UX upgrades (Monarch-inspired roadmap)
```

**No seed data in production.** Portfolio payload comes from home API `GET /api/me`.

---

## Data flow

1. User signs in → cookies set by home API (proxied through Vercel)
2. SSR → `getInitialPortfolioFromApi()` with session cookies
3. `PortfolioProvider` edits state → debounced `POST /api/export` → SQLite on mini PC
4. Failed saves show a toast (check network / validation errors)

---

## Golden rules

1. **Minimize diff** — match existing patterns.
2. **No user data in git** — SQLite lives in api-portfolio `data/`.
3. **No secrets in committed files** — only `.env.example` placeholders.
4. **`API_SECRET` on Vercel** — server env only, never `NEXT_PUBLIC_*`; must match api-portfolio exactly.
5. Read `README.md`, `SECURITY.md`, `TODO.md`, and `CLAUDE.md` (this file).

---

## Commands

```bash
cp .env.example .env
npm run dev          # :3000 — requires api-portfolio on :3001
env -u NODE_ENV npm run build
npm run lint
npm run test:smoke   # local dev server on :3000
```

Also run api-portfolio on `:3001` locally when `API_URL=http://127.0.0.1:3001`.
