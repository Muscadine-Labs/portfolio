# Portfolio UI — Agent Guide

**Release v1.0.9** — API health via same-origin `/api/health` (fixes Settings “Offline”); production saves proxy unchanged.

Context for AI assistants in the **portfolio** repo (Vercel UI).

---

## Version bumps (after every GitHub push)

When you **push this repo to GitHub**, bump `package.json` `version` in that push (or the commit immediately before it).

Versions use three single digits **0–9** per segment (`major.minor.patch`). There is no `1.0.10`.

| Step | Rule |
|------|------|
| Default | Add **+1** to **patch**: `1.0.4` → `1.0.5` |
| Patch is 9 | Patch → `0`, minor **+1**: `1.0.9` → `1.1.0`, `2.0.9` → `2.1.0` |
| Minor and patch both 9 | Minor & patch → `0`, major **+1**: `2.9.9` → `3.0.0` |

Also update the **Release** line at the top of this file (and `AGENTS.md` version if present).

---

## Next.js

Next.js **16** App Router. Check `node_modules/next/dist/docs/` before using deprecated APIs.

---

## Product

Personal finance dashboard at **portfolio.muscadine.io** (Vercel). User data lives on the **home API** (`api-portfolio` on the mini PC).

| URL | Role |
|-----|------|
| `portfolio.muscadine.io` | This repo — UI + `/api/*` proxy |
| `api-portfolio.muscadine.io` | SQLite backend via tunnel |

Login username = tenant slug (e.g. `nick`). Admin user → `/admin`.

---

## Architecture

```
Browser → portfolio.muscadine.io (Vercel)
            ├─ pages (UI)
            └─ /api/* → proxy → api-portfolio.muscadine.io → SQLite
```

---

## Auth

- **`/login`** → proxied `POST /api/auth/login`
- Cookies: `portfolio_session`, `portfolio_tenant`, `portfolio_admin`
- **`src/proxy.ts`** — session gate; admin routes need `portfolio_admin`
- **`API_SECRET`** on Vercel must **exactly** match home API (including base64 `=`)

`proxyToHomeApi()` must buffer upstream JSON bodies (not stream) so login/admin responses work on Vercel.

---

## Env

Only **`.env`** (gitignored) and **`.env.example`** (committed).

| Variable | Purpose |
|----------|---------|
| `API_URL` | Home API base |
| `API_SECRET` | Session HMAC — match api-portfolio |
| `NEXT_PUBLIC_APP_HOST` | Canonical hostname |

Finnhub keys stay on the home API only. Build: `env -u NODE_ENV npm run build` if shell sets `NODE_ENV=development`.

---

## Key paths

```
src/app/                      Pages + /api route handlers
src/components/providers/PortfolioProvider.tsx
src/lib/home-api.ts           proxyToHomeApi()
src/lib/portfolio-data.ts     Validation — keep in sync with api-portfolio
src/lib/overview-period.ts    Net worth chart periods (All default)
src/lib/demo-constants.ts     Client-safe demo tenant check
src/proxy.ts                  Auth middleware
```

---

## Golden rules

1. Minimize diff; match existing patterns.
2. No user data or secrets in git.
3. Keep `portfolio-data.ts` in sync with api-portfolio.
4. Bump version after every push (see above).
5. Read `README.md`, `SECURITY.md`, `AGENTS.md`.

---

## Commands

```bash
cp .env.example .env
npm run dev              # :3000 — api-portfolio on :3001 when using API_URL
env -u NODE_ENV npm run build
npm run lint
npm run test:smoke
npm run test:api         # integration vs home API / demo
```
