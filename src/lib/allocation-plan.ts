import type { AllocationNode } from "@/types";

export function getChildNodes(nodes: AllocationNode[], parentId: string | null): AllocationNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function isAmountTarget(node: AllocationNode): boolean {
  return node.targetMode === "amount" && node.monthlyAmount != null;
}

/** Effective % of income (root nodes use percentOfParent as % of income). */
export function percentOfIncome(
  node: AllocationNode,
  nodes: AllocationNode[],
  cache = new Map<string, number>()
): number {
  if (isAmountTarget(node)) {
    return 0;
  }

  const cached = cache.get(node.id);
  if (cached != null) return cached;

  if (node.parentId == null) {
    cache.set(node.id, node.percentOfParent);
    return node.percentOfParent;
  }

  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent || isAmountTarget(parent)) {
    cache.set(node.id, node.percentOfParent);
    return node.percentOfParent;
  }

  const value = (percentOfIncome(parent, nodes, cache) * node.percentOfParent) / 100;
  cache.set(node.id, value);
  return value;
}

export function dollarAmount(monthlyIncome: number | undefined, percent: number): number | null {
  if (monthlyIncome == null || monthlyIncome <= 0) return null;
  return (monthlyIncome * percent) / 100;
}

/** Planned $/mo for a node (fixed amount or derived from % chain). */
export function plannedMonthlyAmount(
  node: AllocationNode,
  nodes: AllocationNode[],
  monthlyIncome: number | undefined,
  cache = new Map<string, number>()
): number | null {
  const cached = cache.get(node.id);
  if (cached != null) return cached;

  if (isAmountTarget(node)) {
    cache.set(node.id, node.monthlyAmount!);
    return node.monthlyAmount!;
  }

  if (node.parentId == null) {
    const value = dollarAmount(monthlyIncome, node.percentOfParent);
    if (value != null) cache.set(node.id, value);
    return value;
  }

  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return null;

  const parentAmount = plannedMonthlyAmount(parent, nodes, monthlyIncome, cache);
  if (parentAmount == null) return null;

  const value = (parentAmount * node.percentOfParent) / 100;
  cache.set(node.id, value);
  return value;
}

export function childrenPercentSum(nodes: AllocationNode[], parentId: string | null): number {
  return getChildNodes(nodes, parentId)
    .filter((n) => !isAmountTarget(n))
    .reduce((s, n) => s + n.percentOfParent, 0);
}

export function siblingsUsePercentOnly(nodes: AllocationNode[], parentId: string | null): boolean {
  const siblings = getChildNodes(nodes, parentId);
  return siblings.length === 0 || siblings.every((n) => !isAmountTarget(n));
}

/** One-line summary from the user's actual top-level buckets. */
export function formatPlanSummary(nodes: AllocationNode[]): string | null {
  const roots = getChildNodes(nodes, null);
  if (roots.length === 0) return null;
  const parts = roots.map((r) =>
    isAmountTarget(r) ? `${r.label} (${r.monthlyAmount}/mo)` : `${r.label} (${r.percentOfParent}%)`
  );
  return `Top-level split: ${parts.join(" · ")}. Child rows use % of their parent or a fixed $/mo.`;
}
