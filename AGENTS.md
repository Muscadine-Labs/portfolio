# Agent instructions

**Version 0.7.0**

For deployment, security, and detailed conventions, read **`docs/`** first:

- `docs/CLAUDE.md` — codebase map and agent rules  
- `README.md` — production stack and Vercel env  
- `SECURITY.md` — privacy and trust boundaries (repo root)  

---

Personal finance dashboard (Next.js 16): net worth, assets, cash, liabilities, plan, settings.

**Deployed:** https://portfolio.muscadine.io (Vercel). **Data:** https://api-portfolio.muscadine.io (mini PC + tunnel).

---

## Repo at a glance

| Area | Path | Notes |
|------|------|--------|
| Pages & API routes | `src/app/` | App Router; mock API in `src/app/api/` until home server is wired |
| UI components | `src/components/` | Feature folders + `ui/` (shadcn) |
| Shared logic | `src/lib/` | Morpho, import validation, goal math, etc. |
| Types | `src/types/` | `Asset`, `Liability`, `User`, … |
| **Private seed data** | `portfolio-data.ts` (repo root) | **Gitignored** — real balances, wallets, goals |
| **Example seed** | `portfolio-data.example.ts` | **Committed** — generic demo household; safe to edit for structure |
| Seed loader | `src/lib/mock-data.ts` | Re-exports `@portfolio/seed` + small helpers |
| In-memory store (Phase 1) | `src/lib/portfolio-data-store.ts` | Per-tenant portfolio until SQLite API exists |

**Do not put real names, addresses, or balances in committed files.** Use `portfolio-data.example.ts` for demos and docs.

---

## Local setup

```bash
npm install
cp .env.example .env.local
cp portfolio-data.example.ts portfolio-data.ts   # then fill in your numbers
```

`.env.local` (typical):

```bash
DEV_TENANT=workspace              # must match User.tenant in your seed file
PORTFOLIO_SEED_FILE=portfolio-data.ts
# optional: PORTFOLIO_USERNAME / PORTFOLIO_PASSWORD
```

`next.config.ts` resolves `@portfolio/seed` to `portfolio-data.ts` when `PORTFOLIO_SEED_FILE` is set; otherwise the **example** file is used (CI / fresh clones).

```bash
npm run dev          # Turbopack
npm run dev:webpack  # if .next cache issues
npm run clean && npm run dev
npm run lint && npm run build
```

App URL: **`portfolio.muscadine.io`** (or `localhost:3000`). **No per-user DNS subdomains** — `User.tenant` is an internal workspace id only (`src/lib/site.ts`).

---

## How data flows (Phase 1)

1. **Boot:** `PortfolioProvider` loads initial state from `@portfolio/seed` (your `portfolio-data.ts` or the example).
2. **Edits:** React state in the browser; optional persist via `POST /api/import` / `GET /api/export` (JSON) into `portfolio-data-store` (in-memory per tenant).
3. **Morpho sync:** `POST /api/morpho/sync` — sends **public EVM address + chain** to Morpho; merges vault v1/v2 + markets into linked sections.
4. **Later:** UI proxies to `api-portfolio.muscadine.io` on the mini PC; SQLite becomes source of truth.

`src/lib/goal-tracking.ts` is **calculation only** (goal % from section totals) — not where portfolio rows live.

---

## Conventions for agents

1. **Minimize diff** — match existing patterns; no unrelated refactors.
2. **No PII in git** — never commit `portfolio-data.ts`; keep `portfolio-data.example.ts` generic.
3. **Crypto:** group on-chain assets by **wallet** (`section.metadata.walletId`); **network** / **protocol** per asset row.
4. **Secrets** — only in `.env`, never in source.
5. **Next.js 16** — read `node_modules/next/dist/docs/` before changing App Router / APIs (breaking vs older Next).

---

## Useful paths

- Plan → Income buckets: `src/components/plan/AllocationGuide.tsx` (collapsible tree)
- Settings (grouped): `src/components/settings/`
- Morpho: `src/lib/morpho.ts`, `src/app/api/morpho/sync/route.ts`
- Import/export validation: `src/lib/portfolio-data.ts`
- Wallet sections: `src/lib/asset-sections.ts`, `src/lib/wallet-sections.ts`
- Proxy / host: `src/proxy.ts`, `src/lib/site.ts`

---

## Docs (`docs/`)

See the list at the top of this file. Human getting started: `README.md`.
