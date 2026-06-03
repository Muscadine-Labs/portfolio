# Portfolio — roadmap

## Google Sheets integration

- [ ] **Read path** — Import positions or net worth history from a Google Sheet (service account or OAuth; document required scopes in `SECURITY.md`)
- [ ] **Write path (optional)** — Export snapshot or monthly summary row to a sheet tab
- [ ] **Mapping** — Configurable column map (symbol, qty, price, period label) validated like `portfolio-data.ts`
- [ ] **Home API** — Run sync on mini PC (`api-portfolio`): cron or manual `POST /api/import` from sheet fetcher; secrets only in `.env`
- [ ] **UI** — Settings → Data: connect sheet URL, test import, last sync time

**Notes:** Keep SQLite as source of truth after import; sheet is input/export, not live DB. Align period labels with `parsePeriodSortKey` in `src/lib/net-worth-history.ts` (`YYYY-MM`, `Q1 2023`, `Jan '26`, etc.).
