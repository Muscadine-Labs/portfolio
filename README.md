# Portfolio

Next.js personal finance UI for [portfolio.muscadine.io](https://portfolio.muscadine.io). Data lives on the home API ([api-portfolio](https://github.com/Muscadine-Labs/api-portfolio)); this repo is UI + server-side proxy only.

| | |
|---|---|
| **Live UI** | https://portfolio.muscadine.io (Vercel) |
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

Server env: `API_URL`, `API_SECRET` (must match mini PC exactly), `NEXT_PUBLIC_APP_HOST`. Finnhub and admin secrets stay on the home API only.

## Docs

- `CLAUDE.md` / `AGENTS.md` — agent guide (includes version bump rules after push)
- `SECURITY.md` — privacy and trust boundaries
