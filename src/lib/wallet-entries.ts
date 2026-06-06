import {
  detectWalletNetworks,
  normalizeConnectedWalletAddress,
  normalizeWalletNetworks,
  validateWalletNetworks,
} from "@/lib/wallet-address";
import type { WalletAddressEntry, WalletChain, WalletMapNode } from "@/types";

export const SYNCABLE_WALLET_CHAINS = ["ethereum", "base", "bitcoin"] as const;
export type SyncableWalletChain = (typeof SYNCABLE_WALLET_CHAINS)[number];

export function createWalletAddressEntryId(): string {
  return `wa-${crypto.randomUUID()}`;
}

export function emptyWalletAddressEntry(
  networks: WalletChain[] = ["ethereum", "base"]
): WalletAddressEntry {
  return {
    id: createWalletAddressEntryId(),
    address: "",
    networks: normalizeWalletNetworks(networks),
  };
}

/** Normalize legacy single address + networks into addresses[]. */
export function getWalletAddressEntries(wallet: WalletMapNode): WalletAddressEntry[] {
  if (wallet.addresses?.length) {
    return wallet.addresses
      .map((entry) => ({
        id: entry.id,
        address: entry.address.trim(),
        networks: normalizeWalletNetworks(entry.networks ?? []),
        label: entry.label?.trim() || undefined,
      }))
      .filter((entry) => entry.address.length > 0 && entry.networks.length > 0);
  }

  const legacy = wallet.address?.trim() || wallet.identifier?.trim();
  if (!legacy) return [];

  const networks =
    wallet.networks?.length && wallet.networks.length > 0
      ? normalizeWalletNetworks(wallet.networks)
      : detectWalletNetworks(legacy);

  return [
    {
      id: "legacy",
      address: legacy,
      networks,
    },
  ];
}

export function getWalletAllNetworks(wallet: WalletMapNode): WalletChain[] {
  const seen = new Set<WalletChain>();
  const out: WalletChain[] = [];
  for (const entry of getWalletAddressEntries(wallet)) {
    for (const network of entry.networks) {
      if (!seen.has(network)) {
        seen.add(network);
        out.push(network);
      }
    }
  }
  return out;
}

export function hasSyncableWalletAddresses(wallet: WalletMapNode): boolean {
  return getWalletAddressEntries(wallet).some((entry) =>
    entry.networks.some(
      (n): n is SyncableWalletChain =>
        n === "ethereum" || n === "base" || n === "bitcoin"
    )
  );
}

export function validateWalletAddressEntries(
  entries: WalletAddressEntry[]
): { ok: true; entries: WalletAddressEntry[] } | { ok: false; message: string } {
  const normalized = entries
    .map((entry) => ({
      id: entry.id || createWalletAddressEntryId(),
      address: entry.address.trim(),
      networks: normalizeWalletNetworks(entry.networks ?? []),
      label: entry.label?.trim() || undefined,
    }))
    .filter((entry) => entry.address.length > 0);

  if (normalized.length === 0) {
    return { ok: true, entries: [] };
  }

  for (const entry of normalized) {
    if (entry.networks.length === 0) {
      return { ok: false, message: "Each address needs at least one network." };
    }
    const validation = validateWalletNetworks(entry.address, entry.networks);
    if (!validation.ok) {
      return validation;
    }
  }

  const prepared = normalized.map((entry) => ({
    ...entry,
    address: normalizeConnectedWalletAddress(entry.address, entry.networks),
  }));

  return { ok: true, entries: prepared };
}

/** Keep legacy address/networks in sync with first entry for older clients. */
export function walletLegacyFieldsFromEntries(
  entries: WalletAddressEntry[]
): Pick<WalletMapNode, "address" | "networks"> {
  const first = entries[0];
  if (!first) return { address: undefined, networks: undefined };
  return {
    address: first.address,
    networks: first.networks,
  };
}
