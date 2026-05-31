import {
  detectWalletNetworks,
  normalizeWalletNetworks,
} from "@/lib/wallet-address";
import type { WalletChain, WalletMapNode } from "@/types";

export function getWalletChildren(
  nodes: WalletMapNode[],
  parentId: string | null
): WalletMapNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

type LegacyConnectedWallet = {
  id: string;
  label: string;
  address: string;
  networks?: WalletChain[];
  chain?: WalletChain;
  notes?: string;
  links?: WalletMapNode["links"];
};

export function normalizeWalletMapNode(
  node: WalletMapNode & { chain?: WalletChain }
): WalletMapNode {
  const address = node.address?.trim() || node.identifier?.trim() || undefined;
  let networks = node.networks?.length ? normalizeWalletNetworks(node.networks) : undefined;
  if (!networks?.length && node.chain) {
    networks = [node.chain];
  }
  if (!networks?.length && address) {
    networks = detectWalletNetworks(address);
  }

  return {
    id: node.id,
    parentId: node.parentId,
    label: node.label,
    order: node.order,
    owner: node.owner,
    walletType: node.walletType,
    address,
    networks: networks?.length ? networks : undefined,
    links: node.links,
    status: node.status,
    notes: node.notes,
  };
}

export function normalizeWalletMapNodes(nodes: WalletMapNode[]): WalletMapNode[] {
  return nodes.map(normalizeWalletMapNode);
}

/** Import legacy `connectedWallets` rows into the wallet tree by id. */
export function mergeLegacyConnectedWallets(
  nodes: WalletMapNode[],
  legacy: LegacyConnectedWallet[]
): WalletMapNode[] {
  if (legacy.length === 0) return nodes;

  const merged = new Map(nodes.map((node) => [node.id, normalizeWalletMapNode(node)]));
  let rootOrder = nodes.filter((node) => node.parentId === null).length;

  for (const wallet of legacy) {
    const normalized = normalizeWalletMapNode({
      id: wallet.id,
      parentId: null,
      label: wallet.label,
      order: rootOrder,
      address: wallet.address,
      networks: wallet.networks,
      chain: wallet.chain,
      notes: wallet.notes,
      links: wallet.links,
      status: "active",
    });

    const existing = merged.get(normalized.id);
    if (existing) {
      merged.set(normalized.id, {
        ...existing,
        address: existing.address || normalized.address,
        networks: existing.networks?.length ? existing.networks : normalized.networks,
        links: existing.links ?? normalized.links,
        notes: existing.notes ?? normalized.notes,
      });
    } else {
      merged.set(normalized.id, { ...normalized, order: rootOrder });
      rootOrder += 1;
    }
  }

  return [...merged.values()];
}

export function isOnChainWallet(node: WalletMapNode): boolean {
  return Boolean(node.address?.trim());
}
