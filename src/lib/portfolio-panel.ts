import { cn } from "@/lib/utils";

export type PortfolioAccent = "assets" | "cash" | "liabilities" | "neutral";

/** Slate column headers — Bloomberg / terminal neutral, not loud accent fills. */
const wsHead =
  "h-7 px-2 border-b border-slate-600/25 bg-slate-800/85 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-300 dark:border-slate-700/35 dark:bg-slate-950/80 dark:text-slate-400";

const accentBlock: Record<PortfolioAccent, string> = {
  assets: "border-l-[3px] border-l-emerald-800/50 dark:border-l-emerald-700/40",
  cash: "border-l-[3px] border-l-blue-800/50 dark:border-l-blue-700/40",
  liabilities: "border-l-[3px] border-l-red-800/50 dark:border-l-red-700/40",
  neutral: "",
};

const accentPillActive: Record<PortfolioAccent, string> = {
  assets:
    "border-emerald-700/40 bg-emerald-950/40 text-emerald-100 dark:border-emerald-600/35 dark:bg-emerald-950/50",
  cash: "border-blue-700/40 bg-blue-950/40 text-blue-100 dark:border-blue-600/35 dark:bg-blue-950/50",
  liabilities:
    "border-red-700/40 bg-red-950/40 text-red-100 dark:border-red-600/35 dark:bg-red-950/50",
  neutral: "border-border bg-muted text-foreground",
};

/** Sidebar active states for portfolio pages. */
export const portfolioNavAccent: Record<
  Exclude<PortfolioAccent, "neutral">,
  string
> = {
  assets: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cash: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  liabilities: "bg-red-500/15 text-red-700 dark:text-red-400",
};

/** Dense portfolio tables — Wall Street slate palette; color only in data (gains/debt). */
export function portfolioPanel(accent: PortfolioAccent = "neutral") {
  return {
    panel: "overflow-hidden rounded-lg border border-border/60 bg-card/80 shadow-sm",
    /** Sticky page toolbar — no overflow clip (column picker is portaled). */
    toolbarPanel:
      "rounded-lg border border-border/60 bg-card/95 shadow-sm backdrop-blur-md max-sm:rounded-md",
    sectionBlock: cn(
      "overflow-hidden rounded-md border border-border/60 bg-card/50 shadow-sm",
      accentBlock[accent]
    ),
    sectionStack: "space-y-3 pt-1",
    /** Clears sticky header + toolbar when scrolling to a section/group anchor. */
    sectionScrollMargin: "scroll-mt-32 sm:scroll-mt-36",
    sectionTitleRow: "border-b border-border/50 bg-muted/20 px-3 py-2",
    sectionTitle:
      "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground",
    toolbar: "",
    toolbarStickyBar:
      "sticky top-[var(--app-header-height,3rem)] z-40 bg-card/95 shadow-sm backdrop-blur-md",
    toolbarRow: "flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2",
    toolbarDivider: "border-t border-border/60",
    label: "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
    total:
      "font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground",
    meta: "font-mono text-[11px] tabular-nums text-muted-foreground",
    statLabel: "text-[10px] uppercase tracking-wide text-muted-foreground",
    statValue: "font-mono text-[11px] tabular-nums text-foreground",
    headCell: cn("text-left align-middle whitespace-nowrap", wsHead),
    headCellRight: cn(wsHead, "text-right"),
    bandRow: "border-y border-border/60 bg-muted/20 hover:bg-muted/25",
    bandLabel: "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground",
    sectionBodyDivider: "border-t-2 border-border/70",
    dataRow: "border-b border-border/35 hover:bg-muted/15",
    dataCell: "px-2 py-1 text-xs tabular-nums text-foreground",
    symbolCell: "px-2 py-1 text-xs font-semibold tracking-wide text-foreground",
    mutedCell: "px-2 py-1 text-xs tabular-nums text-muted-foreground",
    footerRow: "border-t border-border/50 bg-muted/25 font-medium",
    pill: (active: boolean) =>
      cn(
        "inline-flex max-w-[min(100%,14rem)] shrink-0 items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors",
        active
          ? accentPillActive[accent]
          : "border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
      ),
    pillLabel: "min-w-0 truncate",
    pillValue: "shrink-0 tabular-nums",
    iconBtn: "h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground",
    sectionActions: "flex shrink-0 items-center gap-2 pl-2 sm:pl-3",
    sectionAddBtn:
      "h-7 shrink-0 px-2.5 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground",
    sectionActionDivider: "hidden h-4 w-px bg-border/70 sm:block",
    addSection:
      "h-8 w-full border-dashed border-border/60 bg-muted/15 text-xs uppercase tracking-wide hover:bg-muted/30",
    compactTable: "text-xs",
  } as const;
}

/** Whole-dollar formatting for section subtotals. */
export function formatSectionTotal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
