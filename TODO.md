# Portfolio — roadmap

Possibiltiy, dont focus on now:
## Google Sheets integration

- [ ] **Read path** — Import positions or net worth history from a Google Sheet (service account or OAuth; document required scopes in `SECURITY.md`)
- [ ] **Write path (optional)** — Export snapshot or monthly summary row to a sheet tab
- [ ] **Mapping** — Configurable column map (symbol, qty, price, period label) validated like `portfolio-data.ts`
- [ ] **Home API** — Run sync on mini PC (`api-portfolio`): cron or manual `POST /api/import` from sheet fetcher; secrets only in `.env`
- [ ] **UI** — Settings → Data: connect sheet URL, test import, last sync time

**Notes:** Keep SQLite as source of truth after import; sheet is input/export, not live DB. Align period labels with `parsePeriodSortKey` in `src/lib/net-worth-history.ts` (`YYYY-MM`, `Q1 2023`, `Jan '26`, etc.).

What to work on:
- delete dead code, we built alot, some things are unused.
- Redesign overview page where chart of assets includes all of the sections, so assets isnt in it twice.
- On Allocation on overview, have each overview section the same color on the chart. Improve the assets, liabilties and cash ui so I can view the sections better instead of small tiny blocks. Lets have it like it was before at around 1.0.0, it can be in a single column, but assets can be at the top with the chart, while liability and cash underneith.
- on assets for each overview section, group them by market value of each section. While in each section, have it in alphebetical order for each stock/token. Same goes with cash and liabilties.
- Rename "exhcnages" to "protocols"
- On the edit of a asset/coin, have a toggle where you can manually change the price of a token/vault to a static price, or rely on the api for the price (api defult). If the api doesnt work (alot of the crypto tokens does not work, than try the backup yfiance api python stuff. Also I want to point out, hardcode this info somehwere either if its better in this repo or the api-portfolio repo. USDC always equals 1.00. mpcbBTC = cbBTC = BTC treat them the same. mpWETH = WETH = ETH treat them the same for price. And mpUSDC = USDC treat them the same. For price Cost	Avg	Mkt val	Gain $	Gain %, always go to two decimals, if user did not go to two decimals auto adjust to two decimals by adding 0s. If a symbol has a **, always put it at the bottom of the section no matter its alphebetical order. Also, AU, AG and CU, my tickers for metals do not update, make sure they work and hardcode those to gold silver copper also.
- THe same applys with liabiltiy and cash for these changes.
- On overview on allocations, dont include cash or liabilties on the chart.
- on the overivew (dashbaord) what is ++2059.92%) all time? seems like numbers are off for user nick.
- 
