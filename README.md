# Portfolio

Next.js personal finance UI for [portfolio.muscadine.xyz](https://portfolio.muscadine.xyz). Data lives on the home API ([api-portfolio](https://github.com/Muscadine-Labs/api-portfolio)); this repo is UI + server-side proxy only.

| | |
|---|---|
| **Live UI** | https://portfolio.muscadine.xyz (Vercel) |
| **Home API** | https://api-portfolio.muscadine.io (mini PC + tunnel) |
| **Version** | See `package.json` |

## Local dev

```bash
npm install
cp .env.example .env
npm run dev   # http://localhost:3000
```

With the home API on `:3001`, set `API_URL=http://127.0.0.1:3001` and `API_SECRET` to match api-portfolio.

## Production (Vercel)

Server env (required with home API): `API_URL`, `API_SECRET` (must match mini PC exactly), `NEXT_PUBLIC_APP_HOST`.

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `API_URL` | **Yes** (prod) | Home API base (`https://api-portfolio.muscadine.io`) |
| `API_SECRET` | **Yes** (prod) | Session HMAC — match api-portfolio |
| `NEXT_PUBLIC_APP_HOST` | **Yes** (prod) | Canonical hostname (`portfolio.muscadine.xyz`) |
| `DEV_TENANT` | No | Local tenant slug |
| `PORTFOLIO_USERNAME` / `PORTFOLIO_PASSWORD` | No | Legacy auth when `API_URL` unset |

Finnhub and admin secrets stay on the home API only. See `.env.example`.

## Docs

- `CLAUDE.md` / `AGENTS.md` — agent guide for AI assistants
- `SECURITY.md` — privacy and trust boundaries
