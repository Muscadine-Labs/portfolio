# API Routes

Server-side API routes for the Portfolio backend.

Planned routes (Start9 / `api.portfolio.muscadine.io`):

```
api/
├── auth/
│   ├── login/route.ts
│   └── logout/route.ts
├── me/route.ts
├── assets/route.ts
├── cash/route.ts
├── liabilities/route.ts
├── snapshots/route.ts
├── planning/route.ts          # goals
├── spending/route.ts          # budget items
├── plan/
│   └── allocation/route.ts    # income guide tree + monthlyIncome
├── export/route.ts
├── import/route.ts
└── health/route.ts
```

Implemented mock routes (in-memory store in `src/lib/portfolio-data-store.ts`, seeded from `portfolio-data.ts` / `@portfolio/seed`):

- `GET /api/export` — portfolio JSON for the current tenant
- `POST /api/export` — validate body, save to store, return JSON (Settings uses this with current UI state)
- `POST /api/import` — validate body, replace store, return data for `PortfolioProvider`

Validation lives in `src/lib/portfolio-data.ts`. Invalid imports return `400` with an error message and do not change stored data.

Other routes (assets, cash, liabilities, snapshots, etc.) are still planned for the mini PC API.
