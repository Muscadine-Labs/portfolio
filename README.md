# Portfolio

Personal finance dashboard — **live** at [portfolio.muscadine.io](https://portfolio.muscadine.io).

Data persists on your home API ([api-portfolio.muscadine.io](https://api-portfolio.muscadine.io)) via SQLite on a Linux mini PC. The Vercel deployment is UI + server-side API proxy only.

| Component | URL | Where |
|-----------|-----|--------|
| UI | https://portfolio.muscadine.io | Vercel |
| Home API | https://api-portfolio.muscadine.io | Mini PC + Cloudflare Tunnel |

Companion repo: [Muscadine-Labs/api-portfolio](https://github.com/Muscadine-Labs/api-portfolio)

---

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS
- shadcn/ui, Recharts, Framer Motion
- react-hook-form + Zod
- Auto-save via `POST /api/export` → home API

---

## Getting started (local)

```bash
npm install
cp .env.example .env
npm run dev   # http://localhost:3000
```

With the home API on `:3001`:

```bash
# .env
API_URL=http://127.0.0.1:3001
API_SECRET=<match api-portfolio .env>
```

Optional: copy `portfolio-data.example.ts` → `portfolio-data.ts` for offline seed dev when `API_URL` is unset.

---

## Production (Vercel)

Set in **Settings → Environment Variables** (server only):

| Variable | Example |
|----------|---------|
| `API_URL` | `https://api-portfolio.muscadine.io` |
| `API_SECRET` | Same value as mini PC `API_SECRET` |
| `NEXT_PUBLIC_APP_HOST` | `portfolio.muscadine.io` |

Do **not** put `ADMIN_SECRET` or Finnhub keys on Vercel — those stay on the mini PC.

Sign in at `/login` (username = tenant slug from home API).

---

## Project structure

```
src/
├── app/              # Pages + /api/* route handlers (proxy to home API)
├── components/       # UI by feature
├── lib/              # Portfolio logic, validation, auth, proxy
├── types/
└── proxy.ts          # Session gate (middleware)
CLAUDE.md             # Agent guide
SECURITY.md           # Privacy and trust boundaries
LICENSE               # MIT
```

---

## Routing

Single hostname (`portfolio.muscadine.io`). Middleware redirects unauthenticated users to `/login`. Tenant scope comes from session cookie, not DNS.

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview + net worth chart |
| `/assets`, `/cash`, `/liabilities` | Holdings |
| `/plan` | Income, wallets, budget, goals |
| `/settings` | Account, display, data import/export |
| `/reset` | Username / password change |
| `/admin` | User management (admin session) |

---

## Deployment status (v0.7.1)

| Component | Status |
|-----------|--------|
| UI on Vercel | **Live** |
| Login + session proxy | **Live** |
| Portfolio CRUD via home API | **Live** |
| Cloudflare tunnel | **Live** |
| systemd on mini PC | **Live** |
| DB backup job | Not configured |
| Net worth snapshot timer | Optional — see api-portfolio `scripts/` |

See `SECURITY.md`, `CLAUDE.md`, and `LICENSE` for privacy, agent conventions, and license.
