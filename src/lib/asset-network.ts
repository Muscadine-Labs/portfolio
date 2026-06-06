import type { WalletChain } from "@/types";
import { WALLET_NETWORK_OPTIONS, walletNetworkLabel } from "@/lib/wallet-address";

const KNOWN_CHAINS = new Set<WalletChain>(
  WALLET_NETWORK_OPTIONS.map((option) => option.value)
);

const NETWORK_ALIASES: Record<string, WalletChain> = {
  eth: "ethereum",
  ethereum: "ethereum",
  base: "base",
  btc: "bitcoin",
  bitcoin: "bitcoin",
  sol: "solana",
  solana: "solana",
};

/** Canonical chain slug for storage (ethereum, base, bitcoin, solana). */
export function normalizeAssetNetwork(
  value: string | undefined | null
): WalletChain | undefined {
  if (!value?.trim()) return undefined;
  const lower = value.trim().toLowerCase();
  if (NETWORK_ALIASES[lower]) return NETWORK_ALIASES[lower];
  if (KNOWN_CHAINS.has(lower as WalletChain)) return lower as WalletChain;
  for (const option of WALLET_NETWORK_OPTIONS) {
    if (option.label.toLowerCase() === lower) return option.value;
  }
  return undefined;
}

/** Display label matching wallet UI: Bitcoin, Base, Ethereum, Solana. */
export function formatAssetNetworkLabel(value: string | undefined | null): string {
  if (!value?.trim()) return "—";
  const normalized = normalizeAssetNetwork(value);
  if (normalized) return walletNetworkLabel(normalized);
  return value.trim();
}

export const ASSET_NETWORK_SELECT_OPTIONS = [
  { value: "", label: "None" },
  ...WALLET_NETWORK_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];
