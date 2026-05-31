import type { WalletChain } from "@/types";

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const BTC_RE = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;

export function normalizeEvmAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function detectWalletChain(address: string): WalletChain {
  const trimmed = address.trim();
  if (EVM_RE.test(trimmed)) {
    return "base";
  }
  if (BTC_RE.test(trimmed)) {
    return "bitcoin";
  }
  return "other";
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
    case "other":
      return trimmed.length >= 8;
    default:
      return false;
  }
}

export function morphoChainIdForWallet(chain: WalletChain): number | undefined {
  if (chain === "ethereum") return 1;
  if (chain === "base") return 8453;
  return undefined;
}
