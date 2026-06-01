# Portfolio UI/UX upgrades

Inspired by [Monarch Money](https://help.monarchmoney.com/hc/en-us/articles/360058127551-Customize-dashboard) and similar apps (Empower, Copilot). Focus: scannable dashboard, mobile-first nav, visual planning — without bank linking or transaction feeds.

---

## Phase 1 — Dashboard hierarchy (high impact, ~1–2 days)

- [ ] Move net worth hero to the **top** of Overview (before breakdown tables)
- [ ] Enlarge hero typography (`OverviewSummary.tsx`) — net worth as primary focal point
- [ ] Add chart period selector on net worth history: 1M / 3M / YTD / 1Y / All (`OverviewNetWorthChart.tsx`)
- [ ] Show period change on hero (e.g. “+$12,400 vs last month”)

**Files:** `src/components/dashboard/OverviewContent.tsx`, `OverviewSummary.tsx`, `OverviewNetWorthChart.tsx`

---

## Phase 2 — Allocation cards + insights (~2–3 days)

- [ ] Replace or supplement overview breakdown **tables** with scannable **cards** (icon, label, $ value, % of total)
- [ ] Add allocation donut or horizontal stacked bar (`OverviewAllocationChart.tsx`)
- [ ] Add insight chips below hero: top holding, debt ratio, largest section
- [ ] Softer overview styling — less terminal density; keep dense tables on `/assets`, `/cash`, `/liabilities` only

**Files:** new `OverviewAllocationChart.tsx`, `OverviewInsights.tsx`, `OverviewBreakdownPanel.tsx`

---

## Phase 3 — Mobile navigation (~1–2 days)

- [ ] Bottom tab bar on `<md`: Overview · Assets · Plan · Settings
- [ ] Optional: promote Budget / Goals to nav if Plan tab usage is high
- [ ] Card list view toggle on Assets for small screens (symbol, value, % change)

**Files:** `src/components/layout/DashboardShell.tsx`, new `MobileBottomNav.tsx`, asset table components

---

## Phase 4 — Plan / Budget / Goals polish (~2–3 days)

- [ ] Budget tab: category rows with **progress bars** (% spent, amount remaining) — Monarch-style
- [ ] Goals tab: progress rings or bars with target date and % funded
- [ ] Plan hub: monthly in-vs-out summary card at top of Income tab
- [ ] Consider splitting Budget and Goals into sidebar entries (currently Plan tabs only)

**Files:** `src/components/spending/SpendingContent.tsx`, `src/components/planning/PlanningContent.tsx`, `src/components/plan/PlanContent.tsx`

---

## Phase 5 — Chrome, add flows, onboarding (~2–4 days)

- [ ] Header: net worth pill, last price refresh time on Assets
- [ ] Global **+ Add** action (asset / cash / liability / goal) in header
- [ ] Dashboard **Customize** — show/hide/reorder widgets (extend existing Settings → Navigation prefs)
- [ ] Onboarding checklist for new tenants: add first asset, set budget, add goal
- [ ] Empty states with single primary CTA instead of dashed-border-only copy
- [ ] Breadcrumbs on detail pages: `Overview → Assets → Crypto`

**Files:** `Header.tsx`, `SettingsContent.tsx`, `OverviewContent.tsx`, drawer components

---

## Phase 6 — Admin + consistency (optional)

- [ ] Align `/admin` with app shell and design tokens (currently separate full-page UI)
- [ ] Unify spacing between Settings (spacious cards) and data pages (compact mode)

---

## Reference — what to borrow from Monarch

| Monarch pattern | Our equivalent |
|-----------------|----------------|
| Net worth widget first | Reorder `OverviewContent` |
| Customizable dashboard cards | Widget prefs in Settings |
| Budget progress bars | Budget tab redesign |
| Goals with visual progress | Goals tab redesign |
| Mobile bottom nav | New `MobileBottomNav` |
| Color for meaning (gains, categories) | Keep emerald/blue/red accents; add progress colors |

## Reference — what not to copy

- Bank / institution linking
- Transaction categorization ML
- Subscription upsells or ads

---

## Production checklist (auth)

- [ ] Vercel `API_SECRET` must **exactly** match `api-portfolio` `.env` (no extra trailing `=`)
- [ ] Deploy proxy body fix in `src/lib/home-api.ts` so `/api/auth/login` returns JSON on Vercel
