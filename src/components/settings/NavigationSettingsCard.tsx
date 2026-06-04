"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  DEFAULT_OVERVIEW_WIDGET_ORDER,
  OVERVIEW_WIDGET_LABELS,
} from "@/lib/overview-widgets";
import {
  formatNavSummary,
  NAV_PAGE_LABELS,
  PLAN_SETTINGS_TAB_IDS,
  PLAN_TAB_LABELS,
  SIDEBAR_NAV_PAGE_KEYS,
  type PlanSettingsTabId,
} from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";

export function NavigationSettingsCard() {
  const {
    uiPreferences,
    setNavPageVisible,
    setPlanTabVisible,
    setOverviewWidgetVisible,
    moveOverviewWidget,
  } = usePortfolio();
  const [open, setOpen] = useState(false);
  const summary = formatNavSummary(uiPreferences);
  const planEnabled = uiPreferences.navPages.plan;
  const incomeHidden = planEnabled && !uiPreferences.planTabs.income;
  const widgets = uiPreferences.overviewWidgets;
  const widgetOrder =
    widgets.order.length > 0 ? widgets.order : DEFAULT_OVERVIEW_WIDGET_ORDER;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
          aria-expanded={open}
        >
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{summary}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="space-y-3 rounded-lg border border-border/40 bg-background/40 px-3 py-3">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Sidebar</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {SIDEBAR_NAV_PAGE_KEYS.map((pageKey) => (
                  <label
                    key={pageKey}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={uiPreferences.navPages[pageKey]}
                      onChange={(e) => setNavPageVisible(pageKey, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-input accent-primary"
                    />
                    <Label className="cursor-pointer font-normal">
                      {NAV_PAGE_LABELS[pageKey]}
                    </Label>
                  </label>
                ))}
              </div>
            </div>

            <div className={cn(!planEnabled && "pointer-events-none opacity-40")}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Plan page</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {PLAN_SETTINGS_TAB_IDS.map((tabId) => (
                  <label
                    key={tabId}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={uiPreferences.planTabs[tabId]}
                      disabled={!planEnabled}
                      onChange={(e) =>
                        setPlanTabVisible(tabId as PlanSettingsTabId, e.target.checked)
                      }
                      className="h-3.5 w-3.5 rounded border-input accent-primary"
                    />
                    <Label className="cursor-pointer font-normal">
                      {PLAN_TAB_LABELS[tabId]}
                    </Label>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Budget and Goals stay on the Plan page (tabs there). They are not shown in the
                sidebar.
              </p>
            </div>

            {incomeHidden && (
              <p className="text-xs text-amber-500">
                Income is hidden — open Plan to use Budget and Goals, or turn Income back on.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Hidden sidebar pages are removed from the menu and Overview. Sections with $0 are
              omitted on Overview.
            </p>

            <div className="border-t border-border/40 pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Overview dashboard</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Net worth summary always shows first. Reorder other widgets with the arrows.
              </p>
              <ul className="space-y-2">
                {widgetOrder.map((id, index) => (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/15 px-2 py-1.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={widgets[id]}
                        onChange={(e) => setOverviewWidgetVisible(id, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-input accent-primary"
                      />
                      <Label className="cursor-pointer font-normal">
                        {OVERVIEW_WIDGET_LABELS[id]}
                      </Label>
                    </label>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => moveOverviewWidget(id, "up")}
                        aria-label={`Move ${OVERVIEW_WIDGET_LABELS[id]} up`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === widgetOrder.length - 1}
                        onClick={() => moveOverviewWidget(id, "down")}
                        aria-label={`Move ${OVERVIEW_WIDGET_LABELS[id]} down`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
