import type { Asset } from "@/types";

/** Match api-portfolio eligibility for refresh UI counts. */
export function isFinnhubEligible(asset: Asset): boolean {
  if (asset.priceSource === "manual") return false;
  if (asset.id.startsWith("morpho-")) return false;
  const symbol = asset.symbol.trim();
  if (!symbol || symbol.length > 12) return false;
  if (!/^[A-Z0-9.-]+$/i.test(symbol)) return false;
  if (asset.walletId || asset.network || asset.protocol) return false;
  return true;
}

export type MarketQuotesResponse = {
  updated?: number;
  prices?: Record<string, number>;
  skipped?: string[];
  notFound?: string[];
  apiCalls?: number;
  finnhubCalls?: number;
  yfinanceSymbols?: number;
  sourcesByAsset?: Record<string, "finnhub" | "yfinance">;
  providers?: { finnhub?: boolean; yfinance?: boolean };
  uniqueSymbols?: string[];
  message?: string;
  error?: string;
};
