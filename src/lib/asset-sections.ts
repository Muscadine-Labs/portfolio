import type { PortfolioSection, WalletMapNode } from "@/types";

/** Asset section tied to a connected wallet (one section = one wallet, many networks). */
export function isWalletAssetSection(section: PortfolioSection): boolean {
  return Boolean(section.metadata?.walletId);
}

/** Show network / protocol columns — position lives on a chain inside a wallet. */
export function isWalletPositionSection(section: PortfolioSection): boolean {
  return isWalletAssetSection(section);
}

/** Legacy buckets: Bitcoin cold, CEX — not tied to an on-chain connected wallet. */
export function isLegacyCryptoBucket(section: PortfolioSection): boolean {
  const id = section.id.toLowerCase();
  return id.includes("crypto_bitcoin") || id.includes("crypto_exchanges");
}

export function getWalletForSection(
  section: PortfolioSection,
  wallets: WalletMapNode[]
): WalletMapNode | undefined {
  const walletId = section.metadata?.walletId;
  if (!walletId) return undefined;
  return wallets.find((w) => w.id === walletId);
}

export function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
