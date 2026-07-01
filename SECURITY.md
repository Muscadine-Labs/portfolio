# Security & privacy

How Portfolio handles your data in production.

## Report a vulnerability

If you find a security issue, **do not open a public GitHub issue**. Email **[muscadinelabs@gmail.com](mailto:muscadinelabs@gmail.com)** with a description and steps to reproduce.

---

## Architecture (production)

```
Browser → portfolio.muscadine.xyz (Vercel UI + /api proxy)
       → api-portfolio.muscadine.io (Cloudflare Tunnel)
       → mini PC API + SQLite (data/portfolio.db)
```

- **Source of truth:** SQLite on your mini PC — not Vercel, not git.
- **Vercel** holds the UI and proxies `/api/*` to the home API when `API_URL` is set. Portfolio JSON transits Vercel in memory on each request.
- **Never commit** passwords, API secrets, seeds, or `portfolio-data.ts`.

---

## Secrets

| Secret | Mini PC | Vercel |
|--------|---------|--------|
| `API_SECRET` | Yes — signs session cookies | Yes — verifies cookies (server env) |
| `ADMIN_SECRET` | Yes | No |
| `ADMIN_PASSWORD` | Yes | No |
| `FINNHUB_*` | Yes | No |

See `api-portfolio/.env.example` and `.env.example` in this repo.

---

## What leaves your network

| Data | Notes |
|------|--------|
| Portfolio CRUD / import-export | HTTPS via tunnel (and Vercel proxy) |
| Login password | Hashed on the API; never log plaintext |
| Private keys / seeds | **Not supported** — do not store them in the app |

---

## Third parties

| Party | Role |
|-------|------|
| You (mini PC) | Database owner |
| Vercel | UI + API proxy |
| Cloudflare | DNS, TLS, tunnel |
| Morpho | Public DeFi positions for synced addresses only |
| Finnhub | Optional market quotes (keys on mini PC only) |

---

## We never store

Private keys, seed phrases, or exchange keys with withdrawal rights.
