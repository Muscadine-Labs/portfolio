# Portfolio UI — Agent Guide

**Release v0.7.0** — Login proxy fix for Vercel, API secret rotation, overview chart improvements.

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

**No per-user subdomains.** Login username = internal tenant slug (e.g. `workspace`). Session cookies scope data.

---

## Architecture

```
Browser → portfolio.muscadine.io (Vercel)
            ├─ /login, /admin, /dashboard/*  (UI)
            └─ /api/*  → proxy/rewrite → api-portfolio.muscadine.io
                                              └─ SQLite on mini PC
```

| Layer | Where |
|-------|--------|
| UI | This repo → Vercel |
| API + SQLite | `~/Desktop/api-portfolio` on mini PC |
| Tunnel | `cloudflared` on mini PC |
| DNS | **Cloudflare** nameservers (required for tunnel; Vercel hosts UI only) |

---

## Auth (wired)

- **`/login`** — username + password → home API `/api/auth/login`
- **User session** — httpOnly cookies `portfolio_session` + `portfolio_tenant` (~30 days)
- **Admin session** — httpOnly `portfolio_admin` → **`/admin`** user management
- **`/password`**, **`/reset`** — account password change flows (proxied to home API)
- **`src/proxy.ts`** — redirects unauthenticated users to `/login`; allows `/api/admin/*` when admin cookie present
- **`API_SECRET`** in `.env` must match home API (session HMAC); set on Vercel server env in production

---

## Env files

Only **`.env`** (gitignored) and **`.env.example`** (committed):

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `API_URL` | Home API base (`http://127.0.0.1:3001` local) |
| `API_SECRET` | Session signing — server only, match api-portfolio |
| `NEXT_PUBLIC_APP_HOST` | Canonical hostname |

**Finnhub** keys live only on the home API. The UI calls `POST /api/market/quotes` (proxied); no Finnhub env on Vercel.

Do **not** add `.env.local` — Next.js loads `.env` automatically.

**Build note:** If your shell exports `NODE_ENV=development`, `npm run build` fails with a prerender error on `/_global-error`. Run builds as `NODE_ENV=production npm run build` (Vercel sets this automatically).

---

## Key paths

```
src/app/login/              Sign-in page
src/app/admin/              Admin portal (create/edit/delete users)
src/components/providers/PortfolioProvider.tsx  Client state + auto-save to API
src/components/dashboard/OverviewNetWorthChart.tsx  Net worth bars + cost basis line
src/components/settings/NetWorthHistorySettingsCard.tsx  Edit chart periods (Settings → Data)
src/lib/section-groups.ts   SectionGroup model + migration from legacy overviewGroup
src/lib/net-worth-history.ts  Period sort/format helpers
src/lib/overview-chart.ts   Chart prefs + Y-axis domain
src/lib/home-api.ts         proxyToHomeApi() for route handlers
src/lib/portfolio-api.ts    SSR fetch to home API (forwards cookies)
src/lib/auth.ts             Session verification (matches API HMAC)
src/proxy.ts                Auth gate + x-tenant from cookie
src/components/shared/PortfolioPageToolbar.tsx  Sticky search + section pills
next.config.ts              Rewrites /api/* → API_URL when set
```

**No seed data in this repo.** Portfolio payload comes from home API `GET /api/me`.

---

## Data flow

1. User signs in → cookies set by home API (proxied through Vercel)
2. `TenantPage` SSR → `getInitialPortfolioFromApi()` with session cookies
3. `PortfolioProvider` edits state → debounced `POST /api/export` → SQLite on mini PC

**Market prices:** Assets page **Refresh prices** → `POST /api/market/quotes` → home API Finnhub quotes → SQLite + local state.

**Section groups:** First-class `SectionGroup` rows (`groupId` on sections, `metadata.account`). Overview rolls up by group; Assets/Cash/Liabilities pages show grouped layout via `SectionGroupBlock`. Legacy `metadata.overviewGroup` migrates on import.

**Net worth history:** Stored in `netWorthHistory[]` on the API (`period`, `netWorth`, optional `totalCostBasis`). Edit in **Settings → Data**; chart shows **bars = net worth**, **line = cost basis**. Auto-snapshot toggle (`uiPreferences.monthlyAutoSnapshot`) triggers home API cron on the 1st.

---

## Overview chart (v0.6)

- Fixed layout: net worth **bars** only (no net-worth line/area)
- Optional **cost basis** benchmark line (dashed/solid, settings color)
- Legend top-right; net worth KPI lives in `OverviewSummary` above the chart
- Chart data is **net worth + cost basis only** — not assets/liabilities breakdown

---

## Admin UI

- Edit pencil on each row: username, name, email, password
- Admin row: edit username/password only; **no delete**
- User rows: edit all fields + delete (wipes SQLite row + portfolio JSON)

---

## DNS blocker (production)

Tunnel only works when **Cloudflare** serves DNS for `muscadine.io`. CNAME at Vercel alone is not enough. See `../api-portfolio/docs/CLAUDE.md`.

---

## Golden rules

1. **Minimize diff** — match existing patterns.
2. **No user data in git** — SQLite lives in api-portfolio `data/`.
3. **No secrets in committed files** — only `.env.example` placeholders.
4. **`API_SECRET` on Vercel** — server env only, never `NEXT_PUBLIC_*`.
5. Read `README.md` and `SECURITY.md` for deployment boundaries.

---

## Commands

```bash
cp .env.example .env
npm run dev          # :3000 — requires api-portfolio on :3001
NODE_ENV=production npm run build
npm run lint
```

Also run api-portfolio on `:3001` locally when `API_URL=http://127.0.0.1:3001`.
