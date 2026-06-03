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
import { cn } from "@/lib/utils";

export function OverviewDashboardSettingsCard() {
  const { uiPreferences, setOverviewWidgetVisible, moveOverviewWidget } = usePortfolio();
  const [open, setOpen] = useState(false);
  const widgets = uiPreferences.overviewWidgets;
  const order = widgets.order.length > 0 ? widgets.order : DEFAULT_OVERVIEW_WIDGET_ORDER;

  const summary = order
    .filter((id) => widgets[id])
    .map((id) => OVERVIEW_WIDGET_LABELS[id])
    .join(", ");

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Overview dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
          aria-expanded={open}
        >
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {summary || "No widgets visible"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open ? (
          <div className="space-y-2 rounded-lg border border-border/40 bg-background/40 px-3 py-3">
            <p className="text-xs text-muted-foreground">
              Net worth summary always shows at the top. Reorder other widgets with the arrows.
            </p>
            <ul className="space-y-2">
              {order.map((id, index) => (
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
                      disabled={index === order.length - 1}
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
        ) : null}
      </CardContent>
    </Card>
  );
}
