# Portfolio

**Live:** [portfolio.muscadine.io](https://portfolio.muscadine.io) (Vercel). The UI and Phase 1 API routes run on Vercel; persistent storage on your mini PC (`api.portfolio.muscadine.io`) is still on the roadmap — see `docs/PLAN.md`.

Personal finance dashboard at `portfolio.muscadine.io`. “Workspace” in Settings is an internal ID, not a DNS hostname.

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- shadcn/ui, Recharts, Framer Motion
- react-hook-form + Zod
- Portfolio seed in `portfolio-data.ts` at repo root (gitignored); demo in `portfolio-data.example.ts` — see `SECURITY.md`

## Getting Started

```bash
npm install
npm run dev
```

### URLs

| Host | Page |
|------|------|
| [portfolio.muscadine.io](https://portfolio.muscadine.io) | Production (login, dashboard, all routes) |
| `localhost:3000` | Local dev |
| `api.portfolio.muscadine.io` | Planned home API (mini PC + tunnel — not required for the live UI yet) |

Copy `.env.example` to `.env.local`. Set `DEV_TENANT` to match your seed user slug and `PORTFOLIO_SEED_FILE=portfolio-data.ts` after copying `portfolio-data.example.ts` → `portfolio-data.ts`.

## Project Structure

```
src/
├── app/                    # App Router (pages + layouts)
│   ├── api/                # API routes (mock / in-memory on Vercel today)
│   ├── dashboard/
│   ├── assets/
│   ├── cash/
│   ├── liabilities/
│   ├── plan/               # Guide, budget, goals (tabs)
│   ├── planning/           # redirects → /plan
│   ├── spending/           # redirects → /plan
│   ├── analytics/
│   ├── settings/
│   ├── layout.tsx
│   ├── page.tsx            # Landing / login
│   └── globals.css
├── components/             # UI by feature + shadcn ui/
├── hooks/                  # Custom React hooks
├── lib/                    # Utils, mock data, XLSX, tenant helpers
├── types/                  # Shared TypeScript types
└── proxy.ts                # Session gate; x-tenant from workspace slug (not DNS)
docs/                       # PLAN.md, CLAUDE.md
SECURITY.md                 # Privacy and trust boundaries (repo root)
LICENSE                     # MIT
public/                     # Static assets
```

See `docs/PLAN.md`, `docs/CLAUDE.md`, and `SECURITY.md` for deployment and privacy.

## Routing

One hostname (`portfolio.muscadine.io`). Middleware sets `x-tenant` from `DEV_TENANT` or session (internal workspace ID). `/` redirects to `/dashboard`.

## Deployment status (v0.3.0)

| Component | Status |
|-----------|--------|
| UI on Vercel | **Live** — https://portfolio.muscadine.io |
| Mini PC API + SQLite | Planned — `api.portfolio.muscadine.io` |
| Vercel production data | Demo seed (`portfolio-data.example.ts`) + in-memory store; edits may reset on cold start until the home API is connected |
