# Agent instructions

**Version 1.1.0**

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

## Version bumps (required after GitHub push)

After every **`git push`** to GitHub for this repo:

1. Bump `package.json` `version` by **+0.0.1** on the patch digit.
2. Digits are **0–9** only per segment (no tenth patch like `1.0.10`).
3. **Rollover:** patch `9` → `0` and +1 minor (`1.0.9` → `1.1.0`). Minor and patch both `9` → +1 major (`2.9.9` → `3.0.0`).
4. Update `CLAUDE.md` release line and this file’s version header.

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

Human overview: `README.md`.
