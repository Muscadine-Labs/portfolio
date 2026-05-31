import type { WalletMapNode } from "@/types";

export function getWalletChildren(
  nodes: WalletMapNode[],
  parentId: string | null
): WalletMapNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}
