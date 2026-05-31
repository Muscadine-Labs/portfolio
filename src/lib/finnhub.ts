import type { Asset } from "@/types";

/** Stocks, ETFs, and metals — skip on-chain rows. */
export function isFinnhubEligible(asset: Asset): boolean {
  if (asset.walletId || asset.network || asset.protocol) return false;
  const symbol = asset.symbol.trim();
  if (!symbol || symbol.length > 12) return false;
  return /^[A-Z0-9.-]+$/i.test(symbol);
}

export type MarketQuotesResponse = {
  updated?: number;
  prices?: Record<string, number>;
  skipped?: string[];
  notFound?: string[];
  apiCalls?: number;
  uniqueSymbols?: string[];
  message?: string;
  error?: string;
};
