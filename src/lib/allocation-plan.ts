import type { AllocationNode } from "@/types";

export function getChildNodes(nodes: AllocationNode[], parentId: string | null): AllocationNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

/** Effective % of income (root nodes use percentOfParent as % of income). */
export function percentOfIncome(
  node: AllocationNode,
  nodes: AllocationNode[],
  cache = new Map<string, number>()
): number {
  const cached = cache.get(node.id);
  if (cached != null) return cached;

  if (node.parentId == null) {
    cache.set(node.id, node.percentOfParent);
    return node.percentOfParent;
  }

  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) {
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

export function childrenPercentSum(nodes: AllocationNode[], parentId: string | null): number {
  return getChildNodes(nodes, parentId).reduce((s, n) => s + n.percentOfParent, 0);
}

/** One-line summary from the user's actual top-level buckets. */
export function formatPlanSummary(nodes: AllocationNode[]): string | null {
  const roots = getChildNodes(nodes, null);
  if (roots.length === 0) return null;
  const parts = roots.map((r) => `${r.label} (${r.percentOfParent}%)`);
  return `Top-level split: ${parts.join(" · ")}. Child rows use % of their parent.`;
}
