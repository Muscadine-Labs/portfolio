# Portfolio Tracker — Build & Deployment Plan

**Default stack ($0/mo):** Vercel UI · Linux mini PC (API + SQLite + Cloudflare Tunnel) · DNS on Cloudflare.

- **UI:** [portfolio.muscadine.io](https://portfolio.muscadine.io) — **deployed on Vercel**
- **API:** `api-portfolio.muscadine.io` (Cloudflare Tunnel → mini PC `:3001`) — **wired locally; tunnel DNS pending**
- **Security / trust boundaries:** `SECURITY.md` (repo root)

### Deployment status (v0.6)

| Piece | Status |
|-------|--------|
| Next.js UI on Vercel | **Live** at `portfolio.muscadine.io` |
| UI → home API proxy (`/api/*` rewrite) | **Wired** when `API_URL` set |
| Auth + session cookies | **Live** (login, admin portal) |
| Portfolio CRUD via `GET /api/me`, `POST /api/export` | **Live** (SQLite on mini PC) |
| Net worth history + chart | **Live** — edit in Settings → Data; bars + cost basis line on Overview |
| Section groups (Overview roll-ups) | **Live** — `SectionGroup` + `groupId` on sections |
| Monthly auto-snapshot cron | **API ready** — toggle in Settings → Data; systemd timer on mini PC |
| Mini PC tunnel (`api-portfolio.muscadine.io`) | **Next** — Cloudflare nameservers + `cloudflared` |

---

## Architecture at a Glance

```
portfolio.muscadine.io          →  Vercel (Next.js UI)
api-portfolio.muscadine.io      →  Cloudflare (HTTPS edge)
                                      ↓ tunnel (outbound from home)
                                 cloudflared + API + SQLite  →  Linux mini PC
```

**Login flow (production):**

1. User opens `https://portfolio.muscadine.io/login`.
2. UI proxies auth and data to home API via `API_URL` rewrites.
3. Mini PC validates username/password, sets **httpOnly** session (HMAC with `API_SECRET`).
4. All reads/writes scoped to tenant slug in SQLite.

---

## What Runs Where

| Piece | Where | Cost |
|-------|--------|------|
| UI | Vercel — `portfolio.muscadine.io` | Free |
| API + SQLite | Linux mini PC — port **3001** | Free (your hardware) |
| Tunnel | **cloudflared** on the same mini PC | Free |
| DNS | **Cloudflare** (domain delegated from Namesilo) | Free |

---

## This repo today (v0.6)

UI-only Next.js app on Vercel. **No tenant data in git.** Local dev pairs with api-portfolio on `:3001`.

| Area | Status | Location |
|------|--------|----------|
| Pages | Done | `src/app/` — dashboard, assets, cash, liabilities, plan, settings |
| Portfolio state | From home API | `PortfolioProvider` + `POST /api/export` auto-save |
| Section groups | Done | `src/lib/section-groups.ts`, grouped Assets/Cash/Liabilities UI |
| Net worth chart | Done | `OverviewNetWorthChart.tsx` — bars (net worth) + line (cost basis) |
| Net worth history | Done | `NetWorthHistorySettingsCard.tsx` — Settings → Data |
| Import / export | JSON + Excel | proxied to home API |
| Morpho sync | Done | proxied `POST /api/morpho/sync` |
| Finnhub refresh | Done | proxied `POST /api/market/quotes` |
| Settings | Account, display, nav, data | `src/components/settings/` |

**Env (local):**

```bash
API_URL=http://127.0.0.1:3001
API_SECRET=...   # match api-portfolio
```

**Not wired yet:** Public tunnel hostname for production API (DNS on Cloudflare).

---

## Data model conventions

### Section groups

- Named roll-up buckets for Overview and grouped page layout.
- Sections link via `groupId`; groups have `metadata.account` optional label.
- Legacy `metadata.overviewGroup` string migrates to groups on import.

### Crypto: wallets, not networks

- On-chain assets grouped by **connected wallet** (`metadata.walletId`).
- **Network** and **protocol** per position row.

### Net worth snapshots

```typescript
{ period: string; netWorth: number; totalCostBasis?: number }
```

Chart uses net worth + cost basis only. Capture current / cron fills from live holdings.

---

## DNS: Namesilo + Cloudflare

1. Namesilo → Cloudflare nameservers for `muscadine.io`.
2. Cloudflare: CNAME `portfolio` → Vercel.
3. Tunnel public hostname `api-portfolio` → `http://127.0.0.1:3001` (auto DNS; **not** home IP A record).

---

## Phase A — Mini PC: API + SQLite

**Done** in `api-portfolio` repo — SQLite tenants, auth, import/export, Finnhub, net worth cron.

Verify: `curl http://127.0.0.1:3001/api/health` → 200.

---

## Phase B — Cloudflare Tunnel

On the **same** mini PC as the API:

1. Create tunnel in Cloudflare Zero Trust → install `cloudflared`.
2. Public hostname: `api-portfolio.muscadine.io` → `http://127.0.0.1:3001`.
3. Test from cellular: `curl https://api-portfolio.muscadine.io/api/health`.
4. Backup `/data/portfolio.db` (rsync / Restic).
5. Enable net worth snapshot timer: `scripts/portfolio-snapshot.timer.example`.

---

## Phase C — Vercel frontend

1. ~~Deploy this repo; domain `portfolio.muscadine.io`.~~ **Done**
2. ~~Proxy `/api/*` → home API via `API_URL`.~~ **Done**
3. Set `API_URL` + `API_SECRET` on Vercel server env.
4. Confirm production login + export round-trip to mini PC.

| Variable | Where | Example |
|----------|--------|---------|
| `API_URL` | Vercel server only | `https://api-portfolio.muscadine.io` |
| `API_SECRET` | Vercel server only | match mini PC |

---

## Phase D — First run

1. Create user via `/admin` or `POST /api/auth/register`.
2. Login at `portfolio.muscadine.io/login`.
3. Import JSON or add positions; enable **Auto-snapshot on the 1st** if desired.
4. Confirm from phone on LTE once tunnel is live.

---

## Phase E — Later

- Price cron on mini PC (scheduled Finnhub refresh).
- Split repos already done: `portfolio` (UI) + `api-portfolio` (API).

---

## Cost

| Item | Cost |
|------|------|
| Vercel + Cloudflare + mini PC | **$0/mo** (hardware + domain you already own) |

---

## Checklist (whole stack)

- [x] Vercel: deploy repo; `portfolio.muscadine.io` live
- [x] Login + dashboard on production hostname
- [x] UI proxies to home API when `API_URL` set
- [x] Net worth history + chart (bars + cost basis)
- [x] Section groups on Overview and asset pages
- [ ] Namesilo → Cloudflare nameservers; zone Active
- [ ] Cloudflare: `portfolio` → Vercel (confirm DNS)
- [ ] Mini PC: API healthy on `:3001` in production
- [ ] `cloudflared`: `api-portfolio` → `127.0.0.1:3001`
- [ ] `/api/health` on cellular
- [ ] Vercel production `API_URL` → tunnel hostname
- [ ] Backup job for `portfolio.db`
- [ ] Net worth snapshot systemd timer enabled on mini PC

---

## Reference

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Vercel custom domains](https://vercel.com/docs/projects/domains)
- Agent / codebase guide: `docs/CLAUDE.md`
- Home API guide: `../api-portfolio/docs/CLAUDE.md`
