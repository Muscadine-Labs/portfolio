# Portfolio Tracker — Build & Deployment Plan

**Default stack ($0/mo):** Vercel UI · Linux mini PC (API + SQLite + Cloudflare Tunnel) · DNS on Cloudflare.

- **UI:** [portfolio.muscadine.io](https://portfolio.muscadine.io) — **deployed on Vercel** (single URL; no per-user subdomains)
- **API:** `api.portfolio.muscadine.io` (Cloudflare Tunnel → mini PC `:3001`) — **not live yet**
- **Security / trust boundaries:** `SECURITY.md` (repo root)

### Deployment status

| Piece | Status |
|-------|--------|
| Next.js UI on Vercel | **Live** at `portfolio.muscadine.io` |
| Mock API routes on Vercel | **Live** (`/api/*` in this repo; in-memory per deployment) |
| Mini PC API + SQLite + tunnel | **Next** — persistent data and Morpho sync target |
| BFF `/api/backend/*` → home API | Not wired |

---

## Architecture at a Glance

```
portfolio.muscadine.io          →  Vercel (Next.js UI)
api.portfolio.muscadine.io      →  Cloudflare (HTTPS edge)
                                      ↓ tunnel (outbound from home)
                                 cloudflared + API + SQLite  →  Linux mini PC
```

**Login flow (production):**

1. User opens `https://portfolio.muscadine.io/login`.
2. UI calls home API via `/api/backend/*` proxy (recommended) or `https://api.portfolio.muscadine.io`.
3. Mini PC validates email/password, sets **httpOnly** session (JWT with internal `tenant` workspace id).
4. All reads/writes scoped to that workspace in SQLite (not derived from hostname).

**Cloudflare** terminates HTTPS and forwards through the tunnel. **Your mini PC** holds all financial data.

---

## What Runs Where

| Piece | Where | Cost |
|-------|--------|------|
| UI | Vercel — `portfolio.muscadine.io` | Free |
| API + SQLite | Linux mini PC — Docker, port **3001** | Free (your hardware) |
| Tunnel | **cloudflared** on the same mini PC | Free |
| DNS | **Cloudflare** (domain delegated from Namesilo) | Free |

---

## This repo today (Phase 1 — Vercel + local dev)

The monorepo is **UI + mock API** in one Next.js app, **deployed to Vercel** at `portfolio.muscadine.io`. Persistent storage moves to the mini PC API when Phase B–D are done.

| Area | Status | Location |
|------|--------|----------|
| Pages | Done | `src/app/` — dashboard, assets, cash, liabilities, plan, settings |
| Portfolio state | In-memory per tenant | `src/lib/portfolio-data-store.ts` |
| Seed data | Gitignored private file | `portfolio-data.ts` (copy from `portfolio-data.example.ts`) |
| Import / export | JSON import; Excel export only | `POST /api/import`, `/api/export`, `src/lib/xlsx-portfolio.ts` |
| Auth (optional) | Env or per-tenant credentials | `src/lib/auth.ts`, `/api/auth/*` |
| Morpho sync | Vault v1 + v2 + markets | `src/lib/morpho.ts`, `POST /api/morpho/sync` |
| Overview chart | Seed history + live KPIs from holdings | `NET_WORTH_HISTORY` in seed file |
| Settings | Account, display, wallets, nav, data | `src/components/settings/` |

**Env (local):**

```bash
DEV_TENANT=nick
PORTFOLIO_SEED_FILE=portfolio-data.ts   # optional; default = example seed
PORTFOLIO_USERNAME=...                  # optional gate
PORTFOLIO_PASSWORD=...
```

**Not wired yet:** `/api/backend/*` proxy to mini PC, SQLite, JWT auth on API, quarterly snapshots API.

---

## Data model conventions

### Private seed (`portfolio-data.ts`)

- All balances, wallet addresses, goals, wallet map, net-worth history → **repo root**, **gitignored**.
- Committed template: `portfolio-data.example.ts` (generic “Alex” household demo).
- App imports via `@portfolio/seed` alias (`next.config.ts` + `PORTFOLIO_SEED_FILE`).

### Crypto: wallets, not networks

- On-chain assets grouped by **connected wallet** (one assets section per wallet, `metadata.walletId`).
- **Network** and **protocol** are per **position** (same wallet can hold Base, Ethereum, etc.).
- Settings → Wallets: link address to sections; Morpho sync uses **default sync network** (Base/Ethereum) only for the GraphQL query.

### Plan tab

- Income allocation tree (collapsible buckets in `AllocationGuide.tsx`), wallet map (reference only — no secrets), goals linked to section totals via `src/lib/goal-tracking.ts`.

---

## DNS: Namesilo + Cloudflare

1. Namesilo → Cloudflare nameservers for `muscadine.io`.
2. Cloudflare: CNAME `portfolio` → Vercel.
3. Tunnel public hostname `api.portfolio` → `http://127.0.0.1:3001` (auto DNS; **not** home IP A record).

---

## Phase A — Mini PC: API + SQLite (2–4 hours)

### API routes (`portfolio-api` or `api/` in monorepo)

```
api/app/api/
├── auth/login, logout, status, register
├── me
├── assets, cash, liabilities, snapshots
├── export, import
├── morpho/sync          ← run here in production (not Vercel)
└── health               GET → 200
```

- SQLite: `/data/portfolio.db` (Docker volume).
- Tenant from **verified JWT** on every protected route — not client `x-tenant` alone.
- Env: `API_SECRET`, `ADMIN_SECRET`, `ALLOWED_ORIGINS=https://portfolio.muscadine.io`

```yaml
# docker-compose.yml (mini PC)
services:
  portfolio-api:
    build: ./api
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DATA_DIR: /data
      API_SECRET: ${API_SECRET}
      ADMIN_SECRET: ${ADMIN_SECRET}
      ALLOWED_ORIGINS: https://portfolio.muscadine.io
    volumes:
      - portfolio-data:/data
    restart: unless-stopped
volumes:
  portfolio-data:
```

Verify: `curl http://127.0.0.1:3001/api/health` → 200.

---

## Phase B — Cloudflare Tunnel (~1 hour)

On the **same** mini PC as the API:

1. Create tunnel in Cloudflare Zero Trust → install `cloudflared`.
2. Public hostname: `api.portfolio.muscadine.io` → `http://127.0.0.1:3001`.
3. Test from cellular: `curl https://api.portfolio.muscadine.io/api/health`.
4. Backup `/data/portfolio.db` (rsync / Restic).

---

## Phase C — Vercel frontend

1. ~~Deploy this repo; domain `portfolio.muscadine.io`.~~ **Done** — live on Vercel.
2. Add BFF: `src/app/api/backend/[...path]/route.ts` → `API_URL=https://api.portfolio.muscadine.io`.
3. Browser uses `NEXT_PUBLIC_API_URL=/api/backend` (same-origin cookies).
4. **Do not** set `API_SECRET` on Vercel.
5. Production build: **no** `PORTFOLIO_SEED_FILE=portfolio-data.ts` — use example seed; hydrate from API.

| Variable | Where | Example |
|----------|--------|---------|
| `API_URL` | Vercel server only | `https://api.portfolio.muscadine.io` |
| `NEXT_PUBLIC_API_URL` | Vercel | `/api/backend` |

---

## Phase D — First run

```bash
curl -X POST https://api.portfolio.muscadine.io/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"tenant":"workspace","name":"Nick","email":"you@example.com","password":"..."}'
```

1. Login at `portfolio.muscadine.io/login`.
2. Import JSON via Settings → SQLite on mini PC.
3. Confirm from phone on LTE.

---

## Phase E — Later

- Price cron on mini PC (Finnhub, CoinGecko) — keys in server `.env` only.
- Quarterly net-worth snapshots API (chart currently uses seed `NET_WORTH_HISTORY`).
- Split git repos: `portfolio-api` + `portfolio-web` if desired.

---

## Cost

| Item | Cost |
|------|------|
| Vercel + Cloudflare + mini PC | **$0/mo** (hardware + domain you already own) |

---

## Checklist (whole stack)

- [x] Vercel: deploy repo; `portfolio.muscadine.io` live
- [x] Login + dashboard on production hostname (Phase 1 mock API / seed)
- [ ] Namesilo → Cloudflare nameservers; zone Active (if not already)
- [ ] Cloudflare: `portfolio` → Vercel (confirm DNS)
- [ ] Mini PC: API healthy on `:3001`
- [ ] `cloudflared`: `api.portfolio` → `127.0.0.1:3001`
- [ ] `/api/health` on cellular
- [ ] Vercel: BFF proxy env when home API is ready; **no** `API_SECRET` on Vercel
- [ ] Morpho sync on mini PC API (optional: keep on Vercel until then)
- [ ] Backup job for `portfolio.db`
- [x] `portfolio-data.ts` never committed (gitignored)

---

## Alternatives (not default)

| Path | When |
|------|------|
| Start9 instead of mini PC | StartOS backups; tunnel → Start9 LAN IP |
| Direct API (no Vercel proxy) | Stricter privacy; more CORS/cookie work |
| LAN / VPN only | No public URLs |

---

## Reference

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Vercel custom domains](https://vercel.com/docs/projects/domains)
- Agent / codebase guide: `docs/CLAUDE.md`
