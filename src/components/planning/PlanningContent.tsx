"use client";

import { useMemo, useState } from "react";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GoalProgressRing } from "@/components/planning/GoalProgressRing";
import { PlanningDrawer } from "@/components/planning/PlanningDrawer";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionHeader, AddSectionButton } from "@/components/sections/SectionHeader";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  getLinkedSectionLabel,
  goalProgressPercent,
  isGoalLinkedToPortfolio,
  resolveGoalCurrentAmount,
} from "@/lib/goal-tracking";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PlanningItem, PortfolioSection } from "@/types";

const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
} as const;

const STATUS_COLORS = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/20 text-amber-400",
  completed: "bg-emerald-500/20 text-emerald-400",
} as const;

export function PlanningContent() {
  const {
    planningItems,
    assets,
    cashAccounts,
    liabilities,
    sections,
    getSections,
    upsertPlanningItem,
    deletePlanningItem,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const planningSections = getSections("planning");

  const portfolioData = useMemo(
    () => ({ assets, cashAccounts, liabilities }),
    [assets, cashAccounts, liabilities]
  );

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PlanningItem | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: planningSections.length });
    }
  };

  return (
    <div className="space-y-6">
      {planningSections.map((section) => {
        const items = planningItems.filter((i) => i.sectionId === section.id);
        return (
          <Card key={section.id} className="border-border/60 bg-card/80">
            <SectionHeader
              title={section.label}
              onAddItem={() => {
                setEditing(null);
                setDefaultSectionId(section.id);
                setItemDrawerOpen(true);
              }}
              onEditSection={() => {
                setEditingSection(section);
                setSectionDrawerOpen(true);
              }}
              onDeleteSection={() => deleteSection(section.id, "planning")}
              addItemLabel="Add Goal"
            />
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-muted/15 px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No goals in this section yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setEditing(null);
                      setDefaultSectionId(section.id);
                      setItemDrawerOpen(true);
                    }}
                  >
                    Add goal
                  </Button>
                </div>
              ) : (
                items.map((item) => {
                  const linked = isGoalLinkedToPortfolio(item);
                  const current = resolveGoalCurrentAmount(item, portfolioData);
                  const linkLabel = getLinkedSectionLabel(sections, item);
                  const progress = goalProgressPercent(
                    current,
                    item.targetAmount,
                    item.trackPage
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/40 bg-background/50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {progress != null ? (
                          <div className="relative flex shrink-0 flex-col items-center">
                            <GoalProgressRing percent={progress} />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            <Badge className={cn("text-xs", STATUS_COLORS[item.status])}>
                              {STATUS_LABELS[item.status]}
                            </Badge>
                            {linked && linkLabel && (
                              <Badge
                                variant="outline"
                                className="gap-1 text-[10px] text-primary"
                              >
                                <Link2 className="h-3 w-3" />
                                {linkLabel}
                              </Badge>
                            )}
                          </div>
                          {(item.targetAmount != null || (linked && current != null)) && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.targetAmount != null && current != null
                                ? `${formatCurrency(current)} / ${formatCurrency(item.targetAmount)}`
                                : item.targetAmount != null
                                  ? `Target: ${formatCurrency(item.targetAmount)}`
                                  : linked
                                    ? `Current: ${formatCurrency(current!)}`
                                    : null}
                              {linked && (
                                <span className="text-xs"> · updates with portfolio</span>
                              )}
                            </p>
                          )}
                          {item.targetDate && (
                            <p className="text-xs text-muted-foreground">Due {item.targetDate}</p>
                          )}
                          {item.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                          )}
                          {progress != null && (
                            <Progress value={progress} className="mt-3 h-2 [&>div]:bg-primary/80" />
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing(item);
                              setDefaultSectionId(item.sectionId);
                              setItemDrawerOpen(true);
                            }}
                            aria-label={`Edit ${item.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deletePlanningItem(item.id)}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}

      <AddSectionButton
        onClick={() => {
          setEditingSection(null);
          setSectionDrawerOpen(true);
        }}
      />

      <PlanningDrawer
        open={itemDrawerOpen}
        onOpenChange={setItemDrawerOpen}
        item={editing}
        defaultSectionId={defaultSectionId}
        onSave={upsertPlanningItem}
      />
      <SectionDrawer
        open={sectionDrawerOpen}
        onOpenChange={setSectionDrawerOpen}
        section={editingSection}
        page="planning"
        onSave={saveSection}
      />
    </div>
  );
}
