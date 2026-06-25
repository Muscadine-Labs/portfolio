# Portfolio UI — Agent Guide

**Release v1.2.4** — Fix price refresh proxy: empty POST bodies no longer 502 "Home API unreachable" on Vercel; price refresh sends `{}` with credentials.

**Release v1.2.2** — Session HMAC fails closed in production when `API_SECRET` / `PORTFOLIO_AUTH_SECRET` is unset (matches api-portfolio).

**Release v1.2.1** — Morpho→Cash auto-creates **DeFi Cash** section on wallet save (`ensureWalletSyncSectionForTarget`); wallet drawer fixes (stale Morpho scan reset via panel `key`, clear `syncEnabled` when EVM removed, defer section creation to save — no orphan sections on cancel); `savePortfolio()` failure blocks sync; coerce Morpho target by position kind; validate stale `rowId` on save.

**Release v1.2.0** — Multi-chain wallet editor (`WalletAddressEntriesEditor`: multiple addresses + per-chain checkboxes); wallet sync hardening (preserve `links`/`walletType` on save, merge Morpho mappings on rescan, flush save before sync, pass `morphoDisplayMode`); `PortfolioApiError` when home API unreachable (no silent empty portfolio); proxy returns JSON 401 for unauthenticated API calls; import validates before proxy; demo export returns full portfolio; serialized saves in `PortfolioProvider`; admin passwords masked.

Previous (v1.1.9) — Morpho sync client errors, API status on admin page.

Previous (v1.1.8) — Plan save fix, demo refresh, CoinGecko messaging.

Context for AI assistants in the **portfolio** repo (Vercel UI).

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

Login username = tenant slug. Admin user → `/admin`.

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
- **`src/proxy.ts`** — session gate; admin routes need `portfolio_admin`; unauthenticated `/api/*` (except auth/health) returns JSON 401, not HTML redirect
- **Session secret** on Vercel: `API_SECRET` → `PORTFOLIO_AUTH_SECRET` → `PORTFOLIO_PASSWORD` — must match api-portfolio exactly

`proxyToHomeApi()` must buffer upstream JSON bodies (not stream) so login/admin responses work on Vercel. Strips `content-encoding`/`transfer-encoding` from upstream.

---

## Env

Only **`.env`** (gitignored) and **`.env.example`** (committed).

| Variable | Purpose |
|----------|---------|
| `API_URL` | Home API base |
| `API_SECRET` | Session HMAC — match api-portfolio |
| `PORTFOLIO_AUTH_SECRET` | Optional alternate secret (both repos accept it) |
| `NEXT_PUBLIC_APP_HOST` | Canonical hostname |

Finnhub keys stay on the home API only. Build: `env -u NODE_ENV npm run build` if shell sets `NODE_ENV=development`.

---

## Wallet sync (UI)

Wallet editing lives under **Plan → Wallets** (`WalletMapDrawer.tsx` + `WalletAddressEntriesEditor.tsx`).

| Feature | Path |
|---------|------|
| Multi-address + multi-chain rows | `WalletAddressEntriesEditor.tsx`, `wallet-entries.ts`, `wallet-address.ts` |
| Morpho scan + map to assets/liabilities/cash | `WalletMorphoMappingPanel.tsx` |
| Sync settings (Morpho display mode) | `WalletSyncSettingsCard.tsx` |
| Manual sync | `WalletMapGuide.tsx` → `/api/wallets/sync` |
| Proxy routes | `src/app/api/wallets/sync`, `morpho-preview` |

**Syncable chains (backend):** Ethereum, Base (Morpho), Bitcoin (electrs). Solana can be tagged in the UI but is not auto-synced.

**Daily auto-sync** runs on the home API at 4:30 AM (`portfolio-wallet-sync.timer`) — not triggered from this repo.

Wallet sync only maps to sections with **Crypto** or **DeFi** metadata (`src/lib/wallet-sync-sections.ts`).

Each wallet can have `addresses[]` with per-row networks, plus optional `morphoMappings[]` to pick which Morpho vaults/debt/collateral rows merge into which portfolio sections.

---

## Key paths

```
src/app/                              Pages + /api route handlers
src/components/providers/PortfolioProvider.tsx
src/components/plan/WalletMapDrawer.tsx
src/components/plan/WalletAddressEntriesEditor.tsx
src/components/plan/WalletMorphoMappingPanel.tsx
src/lib/home-api.ts                   proxyToHomeApi()
src/lib/portfolio-api.ts              SSR fetch + PortfolioApiError
src/lib/portfolio-data.ts             Validation — keep in sync with api-portfolio
src/lib/wallet-entries.ts             Multi-address helpers
src/lib/wallet-address.ts             Address format + chain validation
src/proxy.ts                          Auth middleware
```

---

## Golden rules

1. Minimize diff; match existing patterns.
2. No user data or secrets in git.
3. Keep `portfolio-data.ts` in sync with api-portfolio.
4. Read `README.md`, `SECURITY.md`, `AGENTS.md`.

---

## Gotchas learned

- **Proxy must strip `content-encoding`/`transfer-encoding`** from upstream responses (`home-api.ts`) or browser JSON parsing fails on Vercel.
- **Never return empty portfolio on API failure** — `getInitialPortfolioFromApi()` throws `PortfolioApiError` so SSR shows an error instead of wiping data on save.
- **Import validates before proxy** — same as export POST; malformed payloads never hit the home API.
- **Wallet edit must spread existing node** — preserve `links`, `walletType`, `owner` or legacy Morpho routing breaks.
- **Morpho rescan merges mappings** — don't replace the full array; keep mappings for positions not in the latest scan.
- **Morpho→Cash needs DeFi section** — wallet sync only writes to sections with `metadata.isCrypto` or `metadata.isDefi`. Saving a wallet with sync enabled auto-creates **DeFi Cash** (or Crypto/DeFi for other targets) if none exists.
- **Defer section creation to wallet save** — mapping UI does not upsert sections mid-edit; canceling the drawer won't leave orphan sections.
- **Empty POST proxy** — `proxyToHomeApi` must omit body (not send zero-length buffer) when the client POST has no body, or Vercel returns 502.
- **Save before sync** — `savePortfolio()` then POST sync; abort sync if save fails.
- **Money formatting**: use `formatMoneyColumn` / `formatCurrency` — never raw `toFixed(2)` for display.
- **Quote symbols**: `quote-aliases.ts` mirrored with api-portfolio.

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
