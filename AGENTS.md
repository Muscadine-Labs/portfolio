# Agent instructions

**Version 1.0.0**

Read first:

- `CLAUDE.md` — codebase map and agent rules  
- `README.md` — production stack and Vercel env  
- `SECURITY.md` — privacy and trust boundaries  

---

Personal finance dashboard (Next.js 16): net worth, assets, cash, liabilities, plan, settings.

**Deployed:** https://portfolio.muscadine.io (Vercel). **Data:** https://api-portfolio.muscadine.io (mini PC + tunnel).

---

## Repo at a glance

| Area | Path | Notes |
|------|------|--------|
| Pages & API routes | `src/app/` | UI + `/api/*` proxies to home API when `API_URL` set |
| UI components | `src/components/` | Feature folders + `ui/` (shadcn) |
| Shared logic | `src/lib/` | Auth, validation, wallet map |
| Types | `src/types/` | Shared with api-portfolio (keep in sync) |
| Optional local seed | `portfolio-data.ts` (gitignored) | Dev only when `API_URL` unset |
| Example seed | `portfolio-data.example.ts` | Generic demo structure |

**Do not put real names, addresses, or balances in committed files.**

---

## Local setup

```bash
npm install
cp .env.example .env
# With home API:
# API_URL=http://127.0.0.1:3001
# API_SECRET=<match api-portfolio>
npm run dev
env -u NODE_ENV npm run build
npm run lint
npm run test:smoke
```

---

## Data flow (production)

1. Sign in → home API sets session cookies (proxied via Vercel)
2. SSR loads portfolio from `GET /api/me`
3. Edits → debounced `POST /api/export` → SQLite on mini PC

---

## Conventions for agents

1. **Minimize diff** — match existing patterns.
2. **No PII in git** — never commit `portfolio-data.ts` with real data.
3. **Crypto sections** — use section `metadata.isCrypto` (or legacy id/label) for network & exchange columns on assets.
4. **Secrets** — only in `.env`, never in source.
5. **Validation** — keep `src/lib/portfolio-data.ts` in sync with api-portfolio.

---

## Useful paths

- Plan / wallets: `src/components/plan/WalletMapGuide.tsx`, `src/lib/wallet-map.ts`
- Settings: `src/components/settings/`
- Proxy: `src/lib/home-api.ts`, `src/proxy.ts`

Human getting started: `README.md`.
