"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AllocationNodeDrawer } from "@/components/plan/AllocationNodeDrawer";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  childrenPercentSum,
  getChildNodes,
  isAmountTarget,
  percentOfIncome,
  plannedMonthlyAmount,
  siblingsUsePercentOnly,
} from "@/lib/allocation-plan";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AllocationNode } from "@/types";

function AllocationRowDetails({
  node,
  incomePct,
  plannedMonthly,
}: {
  node: AllocationNode;
  incomePct: number;
  plannedMonthly: number | null;
}) {
  return (
    <>
      <p className="truncate text-sm font-medium">{node.label}</p>
      <p className="text-xs text-muted-foreground">
        {isAmountTarget(node) ? (
          <>
            {formatCurrency(node.monthlyAmount!)}/mo
            {node.parentId == null ? " (fixed)" : " (fixed under parent)"}
          </>
        ) : (
          <>
            {node.percentOfParent}% of parent
            {node.parentId == null ? " (income)" : ""}
            {incomePct > 0 && node.parentId != null && (
              <span> · {incomePct.toFixed(1)}% of income</span>
            )}
          </>
        )}
        {plannedMonthly != null && !isAmountTarget(node) && (
          <span> · Plan {formatCurrency(plannedMonthly)}/mo</span>
        )}
      </p>
      {node.notes && (
        <p className="truncate text-xs text-muted-foreground/80">{node.notes}</p>
      )}
    </>
  );
}

function AllocationRow({
  node,
  nodes,
  monthlyIncome,
  depth,
  collapsedIds,
  onToggleCollapse,
  onEdit,
  onAddChild,
  onDelete,
}: {
  node: AllocationNode;
  nodes: AllocationNode[];
  monthlyIncome?: number;
  depth: number;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onEdit: (node: AllocationNode) => void;
  onAddChild: (parent: AllocationNode) => void;
  onDelete: (id: string) => void;
}) {
  const children = getChildNodes(nodes, node.id);
  const hasChildren = children.length > 0;
  const isCollapsed = hasChildren && collapsedIds.has(node.id);
  const incomePct = percentOfIncome(node, nodes);
  const plannedMonthly = plannedMonthlyAmount(node, nodes, monthlyIncome);
  const childSum = childrenPercentSum(nodes, node.id);
  const sumOk =
    siblingsUsePercentOnly(nodes, node.id) &&
    (children.length === 0 || Math.abs(childSum - 100) < 0.01);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2",
          depth > 0 && "ml-4 border-l-2 border-l-primary/20"
        )}
        style={{ marginLeft: depth > 0 ? depth * 12 : 0 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            onClick={() => onToggleCollapse(node.id)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${node.label}` : `Collapse ${node.label}`}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isCollapsed && "-rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        {hasChildren ? (
          <button
            type="button"
            className="min-w-0 flex-1 cursor-pointer rounded-md text-left hover:bg-muted/30"
            onClick={() => onToggleCollapse(node.id)}
          >
            <AllocationRowDetails
              node={node}
              incomePct={incomePct}
              plannedMonthly={plannedMonthly}
            />
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <AllocationRowDetails
              node={node}
              incomePct={incomePct}
              plannedMonthly={plannedMonthly}
            />
          </div>
        )}
        {!sumOk && children.length > 0 && (
          <Badge variant="outline" className="shrink-0 text-[10px] text-amber-500">
            {childSum.toFixed(0)}%
          </Badge>
        )}
        <div className="flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(node)}
            title="Add sub-allocation"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(node)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {!isCollapsed &&
        children.map((child) => (
          <AllocationRow
            key={child.id}
            node={child}
            nodes={nodes}
            monthlyIncome={monthlyIncome}
            depth={depth + 1}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}

export function AllocationGuide() {
  const {
    allocationNodes,
    incomePlan,
    setIncomePlanDescription,
    monthlyIncome,
    setMonthlyIncome,
    upsertAllocationNode,
    deleteAllocationNode,
  } = usePortfolio();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AllocationNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string | undefined>();
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const roots = useMemo(() => getChildNodes(allocationNodes, null), [allocationNodes]);
  const rootSum = useMemo(() => childrenPercentSum(allocationNodes, null), [allocationNodes]);
  const investRoot = roots.find((r) => /invest/i.test(r.label)) ?? roots[0];
  const investMonthly =
    investRoot != null ? plannedMonthlyAmount(investRoot, allocationNodes, monthlyIncome) : null;

  const openAdd = (pid: string | null, label?: string) => {
    setEditing(null);
    setParentId(pid);
    setParentLabel(label);
    setDrawerOpen(true);
  };

  const openEdit = (node: AllocationNode) => {
    setEditing(node);
    setParentId(node.parentId);
    setParentLabel(undefined);
    setDrawerOpen(true);
  };

  const siblingCount = parentId
    ? getChildNodes(allocationNodes, parentId).length
    : roots.length;

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income split</CardTitle>
          <p className="text-xs text-muted-foreground">
            Set each bucket as a % of its parent or a fixed monthly $. Edit the plan below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="income-plan-desc">Your plan (editable)</Label>
            <textarea
              id="income-plan-desc"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={incomePlan.description}
              onChange={(e) => setIncomePlanDescription(e.target.value)}
            />
          </div>

          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="monthly-income">Monthly income (optional)</Label>
            <Input
              id="monthly-income"
              type="number"
              step="any"
              placeholder="e.g. 8000"
              value={monthlyIncome ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setMonthlyIncome(v === "" ? undefined : Number(v));
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {roots.map((root) => {
              const amt = plannedMonthlyAmount(root, allocationNodes, monthlyIncome);
              return (
                <div
                  key={root.id}
                  className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{root.label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ·{" "}
                    {isAmountTarget(root)
                      ? `${formatCurrency(root.monthlyAmount!)}/mo`
                      : `${root.percentOfParent}% income`}
                    {amt != null && !isAmountTarget(root) && ` · ${formatCurrency(amt)}`}
                  </span>
                </div>
              );
            })}
            {siblingsUsePercentOnly(allocationNodes, null) && Math.abs(rootSum - 100) > 0.01 && (
              <Badge variant="outline" className="text-amber-500">
                Top level totals {rootSum.toFixed(0)}% (aim for 100%)
              </Badge>
            )}
            {investMonthly != null && investRoot && (
              <div className="w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm sm:w-auto">
                <span className="text-muted-foreground">{investRoot.label} each month: </span>
                <span className="font-semibold text-primary">{formatCurrency(investMonthly)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => openAdd(null)}>
              <Plus className="mr-1 h-4 w-4" />
              Add top-level bucket
            </Button>
          </div>

          {roots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No buckets yet. Add Invest (50%) and Living (50%), then nest brokerage, Roth,
                Bitcoin, and DeFi under Invest.
              </p>
              <Button className="mt-4" size="sm" onClick={() => openAdd(null)}>
                <Plus className="mr-1 h-4 w-4" />
                Create your first bucket
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {roots.map((root) => (
                <AllocationRow
                  key={root.id}
                  node={root}
                  nodes={allocationNodes}
                  monthlyIncome={monthlyIncome}
                  depth={0}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={toggleCollapse}
                  onEdit={openEdit}
                  onAddChild={(n) => openAdd(n.id, n.label)}
                  onDelete={deleteAllocationNode}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AllocationNodeDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        node={editing}
        parentId={parentId}
        parentLabel={parentLabel}
        siblingCount={siblingCount}
        onSave={upsertAllocationNode}
      />
    </div>
  );
}
