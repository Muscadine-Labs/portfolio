# Agent instructions

**Version 1.2.1**

Read first: `CLAUDE.md` (full guide), `README.md`, `SECURITY.md`.

---

## What this repo is

Next.js 16 UI for personal finance (net worth, assets, plan, settings). Deployed on Vercel; persistence via proxied calls to **api-portfolio** (SQLite on mini PC).

| Area | Path |
|------|------|
| Pages & API routes | `src/app/` |
| Components | `src/components/` |
| Logic | `src/lib/` |
| Types | `src/types/` — sync with api-portfolio |

Do not commit real balances, names, or `portfolio-data.ts` with PII.

---

## Local commands

```bash
npm install && cp .env.example .env
npm run dev
env -u NODE_ENV npm run build && npm run lint
npm run test:smoke && npm run test:api
```

---

## Conventions

1. Minimize diff.
2. Crypto columns: section `metadata.isCrypto` on assets.
3. Secrets only in `.env`.
4. Validation parity with api-portfolio `portfolio-data.ts`.
5. Wallet UI: use `WalletAddressEntriesEditor` for multi-address/multi-chain; don't collapse to a single EVM field.

Human overview: `README.md`.
