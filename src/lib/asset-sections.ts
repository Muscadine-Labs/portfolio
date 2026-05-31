import type { PortfolioSection } from "@/types";

function sectionLooksCrypto(section: PortfolioSection): boolean {
  const id = section.id.toLowerCase();
  const label = section.label.toLowerCase();
  return (
    id.includes("crypto") ||
    label.includes("crypto") ||
    label.includes("bitcoin") ||
    label.includes("defi") ||
    label.includes("exchange")
  );
}

/** Legacy buckets: Bitcoin cold, CEX — not tied to an on-chain connected wallet. */
export function isLegacyCryptoBucket(section: PortfolioSection): boolean {
  const id = section.id.toLowerCase();
  return id.includes("crypto_bitcoin") || id.includes("crypto_exchanges");
}

/** Crypto / on-chain asset section — show network & exchange columns on positions. */
export function isCryptoAssetSection(section: PortfolioSection): boolean {
  if (section.metadata?.isCrypto === true || section.metadata?.isDefi === true) return true;
  if (isLegacyCryptoBucket(section)) return true;
  return sectionLooksCrypto(section);
}

/** @deprecated Use isCryptoAssetSection */
export function isWalletAssetSection(section: PortfolioSection): boolean {
  return isCryptoAssetSection(section);
}

/** Show network / exchange columns — position lives on a chain or exchange. */
export function isWalletPositionSection(section: PortfolioSection): boolean {
  return isCryptoAssetSection(section);
}

export function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
