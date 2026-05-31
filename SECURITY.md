# Security & privacy

How Portfolio handles your data today and when the home API is live. Details: `docs/PLAN.md`.

## Report a vulnerability

If you find a security issue, **do not open a public GitHub issue**. Email **[muscadinelabs@gmail.com](mailto:muscadinelabs@gmail.com)** with a description and steps to reproduce. We will acknowledge and work on a fix as soon as we can.

---

## Today (Vercel)

- **Live UI:** [portfolio.muscadine.io](https://portfolio.muscadine.io) — demo seed (`portfolio-data.example.ts`) and in-memory `/api` data (may reset on cold starts).
- **Your real numbers:** `portfolio-data.ts` at repo root — **gitignored**, local dev only until the home API ships.
- **Never commit** passwords, keys, seeds, or `portfolio-data.ts`.

## Planned (home API)

```
Browser → portfolio.muscadine.io (Vercel UI)
       → /api/backend/* (optional proxy) → Cloudflare Tunnel → mini PC API + SQLite
```

- **Source of truth:** your mini PC database, not Vercel.
- **Secrets** (`API_SECRET`, `ADMIN_SECRET`) stay on the mini PC only — never in the Vercel client bundle.
- If you use the Vercel proxy, portfolio JSON transits Vercel in memory on each request; treat Vercel as a trusted host or call the API directly with strict CORS.

## What leaves your network

| Data | Notes |
|------|--------|
| Portfolio CRUD / import-export | HTTPS via tunnel (and Vercel if proxied) |
| Login password | Hashed on the API; never log plaintext |
| EVM address (Morpho sync) | Public on-chain data to `api.morpho.org` — no private keys |
| Private keys / seeds | **Not supported** — do not store them in the app |

## Third parties

| Party | Role |
|-------|------|
| You (mini PC) | Database owner |
| Vercel | UI (+ optional API proxy) |
| Cloudflare | DNS, TLS, tunnel |
| Morpho | Public DeFi positions for synced addresses only |

## We never store

Private keys, seed phrases, or exchange keys with withdrawal rights.
