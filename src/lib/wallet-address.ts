import type { WalletChain } from "@/types";

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const BTC_RE = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const WALLET_NETWORK_OPTIONS: { value: WalletChain; label: string }[] = [
  { value: "ethereum", label: "Ethereum" },
  { value: "base", label: "Base" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "solana", label: "Solana" },
];

const WALLET_CHAIN_VALUES: WalletChain[] = [
  "ethereum",
  "base",
  "bitcoin",
  "solana",
  "other",
];

export function walletNetworkLabel(chain: WalletChain): string {
  return WALLET_NETWORK_OPTIONS.find((option) => option.value === chain)?.label ?? chain;
}

export function normalizeEvmAddress(address: string): string {
  return address.trim().toLowerCase();
}

export type WalletAddressFormat = "evm" | "bitcoin" | "solana" | "other";

export function getWalletAddressFormat(address: string): WalletAddressFormat {
  const trimmed = address.trim();
  if (EVM_RE.test(trimmed)) return "evm";
  if (BTC_RE.test(trimmed)) return "bitcoin";
  if (SOLANA_RE.test(trimmed)) return "solana";
  return "other";
}

/** Networks compatible with this address format. */
export function getCompatibleWalletNetworks(address: string): WalletChain[] {
  switch (getWalletAddressFormat(address)) {
    case "evm":
      return ["ethereum", "base"];
    case "bitcoin":
      return ["bitcoin"];
    case "solana":
      return ["solana"];
    default:
      return ["other"];
  }
}

/** Suggested networks when pasting an address (defaults to all compatible). */
export function detectWalletNetworks(address: string): WalletChain[] {
  return getCompatibleWalletNetworks(address);
}

/** @deprecated Use detectWalletNetworks */
export function detectWalletChain(address: string): WalletChain {
  return detectWalletNetworks(address)[0] ?? "other";
}

export function isValidWalletAddress(address: string, chain: WalletChain): boolean {
  const trimmed = address.trim();
  if (!trimmed) return false;
  switch (chain) {
    case "ethereum":
    case "base":
      return EVM_RE.test(trimmed);
    case "bitcoin":
      return BTC_RE.test(trimmed);
    case "solana":
      return SOLANA_RE.test(trimmed);
    case "other":
      return trimmed.length >= 8;
    default:
      return false;
  }
}

export function validateWalletNetworks(
  address: string,
  networks: WalletChain[]
): { ok: true } | { ok: false; message: string } {
  const unique = normalizeWalletNetworks(networks);
  if (unique.length === 0) {
    return { ok: false, message: "Select at least one network" };
  }

  const compatible = new Set(getCompatibleWalletNetworks(address));
  for (const network of unique) {
    if (!compatible.has(network)) {
      return { ok: false, message: "Address does not match the selected networks" };
    }
    if (!isValidWalletAddress(address, network)) {
      return { ok: false, message: `Invalid address for ${walletNetworkLabel(network)}` };
    }
  }

  return { ok: true };
}

export function normalizeWalletNetworks(networks: WalletChain[]): WalletChain[] {
  const seen = new Set<WalletChain>();
  const normalized: WalletChain[] = [];
  for (const network of networks) {
    if (!WALLET_CHAIN_VALUES.includes(network) || seen.has(network)) continue;
    seen.add(network);
    normalized.push(network);
  }
  return normalized;
}

export function normalizeConnectedWalletAddress(address: string, networks: WalletChain[]): string {
  const trimmed = address.trim();
  if (networks.some((network) => network === "ethereum" || network === "base")) {
    return normalizeEvmAddress(trimmed);
  }
  return trimmed;
}

export function getMorphoWalletNetworks(networks: WalletChain[]): Array<"ethereum" | "base"> {
  return normalizeWalletNetworks(networks).filter(
    (network): network is "ethereum" | "base" =>
      network === "ethereum" || network === "base"
  );
}

export function morphoChainIdForWallet(chain: WalletChain): number | undefined {
  if (chain === "ethereum") return 1;
  if (chain === "base") return 8453;
  return undefined;
}

/** Mask addresses / long identifiers in UI (full value still stored for sync). */
export function formatSensitiveReference(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (EVM_RE.test(trimmed) || BTC_RE.test(trimmed) || SOLANA_RE.test(trimmed)) {
    return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
  }
  if (trimmed.length > 24) {
    return `${trimmed.slice(0, 10)}…${trimmed.slice(-4)}`;
  }
  return trimmed;
}
