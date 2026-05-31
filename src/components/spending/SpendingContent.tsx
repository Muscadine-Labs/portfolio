"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpendingDrawer } from "@/components/spending/SpendingDrawer";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionHeader, AddSectionButton } from "@/components/sections/SectionHeader";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { formatCurrency, getGainColor } from "@/lib/utils";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { PortfolioSection, SpendingItem } from "@/types";

export function SpendingContent() {
  const {
    spendingItems,
    getSections,
    upsertSpendingItem,
    deleteSpendingItem,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const sections = getSections("spending");

  const totals = useMemo(() => {
    const budget = spendingItems.reduce((s, i) => s + i.budget, 0);
    const spent = spendingItems.reduce((s, i) => s + i.spent, 0);
    return { budget, spent, remaining: budget - spent };
  }, [spendingItems]);

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SpendingItem | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: sections.length });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <AnimatedNumber value={totals.budget} />
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${getGainColor(-1)}`}>
              <AnimatedNumber value={totals.spent} />
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${getGainColor(totals.remaining)}`}>
              <AnimatedNumber value={totals.remaining} />
            </p>
          </CardContent>
        </Card>
      </div>

      {sections.map((section) => {
        const items = spendingItems.filter((i) => i.sectionId === section.id);
        const sectionBudget = items.reduce((s, i) => s + i.budget, 0);
        const sectionSpent = items.reduce((s, i) => s + i.spent, 0);

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
              onDeleteSection={() => deleteSection(section.id, "spending")}
              addItemLabel="Add Item"
            />
            <CardContent className="space-y-3">
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(sectionSpent)} of {formatCurrency(sectionBudget)} used
                </p>
              )}
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items in this section</p>
              ) : (
                items.map((item) => {
                  const pct = item.budget > 0 ? Math.min(100, (item.spent / item.budget) * 100) : 0;
                  const over = item.spent > item.budget;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/40 bg-background/50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.frequency.replace("_", "-")} ·{" "}
                            <span className={over ? "text-red-400" : ""}>
                              {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                            </span>
                          </p>
                          {item.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                          )}
                          <Progress
                            value={pct}
                            className={`mt-2 h-1.5 ${over ? "[&>div]:bg-red-500" : ""}`}
                          />
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
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteSpendingItem(item.id)}
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

      <AddSectionButton onClick={() => {
        setEditingSection(null);
        setSectionDrawerOpen(true);
      }} />

      <SpendingDrawer
        open={itemDrawerOpen}
        onOpenChange={setItemDrawerOpen}
        item={editing}
        defaultSectionId={defaultSectionId}
        onSave={upsertSpendingItem}
      />
      <SectionDrawer
        open={sectionDrawerOpen}
        onOpenChange={setSectionDrawerOpen}
        section={editingSection}
        page="spending"
        onSave={saveSection}
      />
    </div>
  );
}
