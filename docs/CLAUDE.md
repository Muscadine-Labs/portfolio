# Portfolio Tracker — Agent Guide

Context for AI assistants working in this repo.

---

## Next.js (read before coding)

This project uses **Next.js 16** with breaking changes vs older versions. Before writing App Router code, read the relevant guide in `node_modules/next/dist/docs/` and follow deprecation notices.

---

## Product summary

Personal finance dashboard (net worth, assets, cash, liabilities, plan, settings).

| URL | Role |
|-----|------|
| `portfolio.muscadine.io` | UI (Vercel) — **live**; one hostname for all users |
| `api.portfolio.muscadine.io` | API (Cloudflare Tunnel → mini PC `:3001`) — **planned** |

**No per-user DNS subdomains.** `User.tenant` is an internal workspace slug for SQLite scoping. JWT/session carries `tenant` after login.

**Default production:** email/password → JWT on `portfolio.muscadine.io`.

**Deploy plan:** `docs/PLAN.md` · **Security:** `SECURITY.md`

---

## Architecture

**Today:** UI + `/api/*` mock routes ship on Vercel. **Target:** home API + SQLite below.

```
Browser
  └─► portfolio.muscadine.io (Vercel)
          └─► /api/backend/*  (recommended BFF)
                  └─► Cloudflare
                          └─► cloudflared (mini PC)
                                  └─► API :3001
                                          └─► SQLite /data/portfolio.db
```

| Layer | Where |
|-------|--------|
| Frontend | This repo → Vercel |
| API + DB | Docker on Linux mini PC |
| Tunnel | cloudflared on same mini PC |
| DNS | Cloudflare (Namesilo → CF nameservers) |

---

## This repo (Phase 1 monorepo)

Single Next.js app deployed to **Vercel** (`portfolio.muscadine.io`). Mock API runs in the same deployment until the mini PC API is wired.

### Key paths

```
portfolio-data.ts              # gitignored — real seed (repo root)
portfolio-data.example.ts      # committed demo seed
src/lib/mock-data.ts           # re-exports @portfolio/seed + helpers
src/lib/portfolio-data.ts      # import/export validation types
src/lib/portfolio-data-store.ts # in-memory store per tenant
src/lib/morpho.ts              # Morpho GraphQL (v1 vaults + v2 + markets)
src/lib/goal-tracking.ts       # goal % math only — no balances
src/lib/site.ts                # APP_HOST, isAppHostname (no subdomain tenants)
src/lib/asset-sections.ts      # isWalletAssetSection(), etc.
src/components/providers/PortfolioProvider.tsx
src/app/api/                   # auth, import, export, morpho/sync
```

### Seed loading

- Alias `@portfolio/seed` → `portfolio-data.example.ts` by default.
- `PORTFOLIO_SEED_FILE=portfolio-data.ts` in `.env.local` + `next.config.ts` for private data.
- **Never commit** `portfolio-data.ts`.

### Crypto model

- Group on-chain holdings by **wallet** (section `metadata.walletId`).
- `network` / `protocol` on each **asset row**, not in section title.
- Morpho sync: public address + chain only; supports `vaultPositions` (v1) and `vaultV2Positions` (v2).

### Settings sections

Account · Display · Wallets & DeFi · Navigation · Data (import/export JSON + Excel).

### UI stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui, Recharts, react-hook-form + Zod.

---

## API rules (production mini PC)

- Resolve `tenant` from **verified JWT** on protected routes — not `x-tenant` header alone.
- `API_SECRET`, `ADMIN_SECRET` on mini PC env only — **never** Vercel client env.
- `POST /api/auth/register` requires `Authorization: Bearer $ADMIN_SECRET`.
- Passwords: bcrypt in SQLite; httpOnly `portfolio_session` cookie.
- Morpho sync should run on **mini PC API**, not on public Vercel.
- `ALLOWED_ORIGINS=https://portfolio.muscadine.io` if browser calls API without BFF proxy.

---

## Phase 1 scope (shipped in UI)

- Manual assets / cash / liabilities with sections
- JSON import/export; Excel export (Overview, Assets, Cash, Liabilities, Plan)
- Connected wallets + Morpho sync (mock route on Vercel today)
- Plan: income allocation (collapsible bucket tree on Plan → Income), wallet map (labels only), goals with section tracking
- Overview chart prefs in settings; net worth history from seed file; Y-axis scaled to data range (not zero)

**Not yet:** BFF to mini PC, SQLite persistence, snapshot API, live price feeds. **Live on Vercel:** UI, mock `/api/*`, Morpho sync route, import/export.

---

## Golden rules for agents

1. **Minimize diff** — match existing patterns; no drive-by refactors.
2. **No PII in git** — use `portfolio-data.example.ts` for demos; never add real addresses/names to committed files.
3. **No secrets in code** — env vars only.
4. **Production target** = mini PC + Cloudflare + Vercel; tenant from session JWT.
5. **$0/mo default** — no VPS in the default plan.
6. Read `node_modules/next/dist/docs/` when touching Next.js APIs.

---

## Commands

```bash
npm run dev          # Turbopack
npm run dev:webpack  # if Turbopack cache issues
npm run clean        # rm -rf .next
npm run build
npm run lint
```
