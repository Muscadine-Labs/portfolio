import type { OverviewWidgetId, OverviewWidgetsPreferences } from "@/types";

export const OVERVIEW_WIDGET_LABELS: Record<OverviewWidgetId, string> = {
  insights: "Insight chips",
  chart: "Net worth chart",
  breakdown: "Category cards",
};

export const DEFAULT_OVERVIEW_WIDGET_ORDER: OverviewWidgetId[] = [
  "insights",
  "chart",
  "breakdown",
];

export const DEFAULT_OVERVIEW_WIDGETS: OverviewWidgetsPreferences = {
  insights: true,
  chart: true,
  breakdown: true,
  order: [...DEFAULT_OVERVIEW_WIDGET_ORDER],
};

const WIDGET_IDS = new Set<OverviewWidgetId>(DEFAULT_OVERVIEW_WIDGET_ORDER);

export function normalizeOverviewWidgets(
  raw?: Partial<OverviewWidgetsPreferences> | null
): OverviewWidgetsPreferences {
  const merged = { ...DEFAULT_OVERVIEW_WIDGETS, ...raw };
  const order: OverviewWidgetId[] = [];
  for (const id of merged.order ?? []) {
    if (WIDGET_IDS.has(id) && !order.includes(id)) order.push(id);
  }
  for (const id of DEFAULT_OVERVIEW_WIDGET_ORDER) {
    if (!order.includes(id)) order.push(id);
  }
  return {
    insights: merged.insights !== false,
    chart: merged.chart !== false,
    breakdown: merged.breakdown !== false,
    order,
  };
}

export function isOverviewWidgetVisible(
  prefs: OverviewWidgetsPreferences,
  id: OverviewWidgetId
): boolean {
  return prefs[id];
}

export function orderedVisibleOverviewWidgets(
  prefs: OverviewWidgetsPreferences
): OverviewWidgetId[] {
  return prefs.order.filter((id) => isOverviewWidgetVisible(prefs, id));
}

export function moveOverviewWidgetInOrder(
  order: OverviewWidgetId[],
  id: OverviewWidgetId,
  direction: "up" | "down"
): OverviewWidgetId[] {
  const index = order.indexOf(id);
  if (index < 0) return order;
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= order.length) return order;
  const next = [...order];
  [next[index], next[swap]] = [next[swap], next[index]];
  return next;
}
