import type { Asset } from "@/types";
import {
  getFixedUsdPrice,
  hasQuoteAlias,
  isMorphoVaultShareSymbol,
} from "@/lib/quote-aliases";

/** Match api-portfolio eligibility for refresh UI counts. */
export function isFinnhubEligible(asset: Asset): boolean {
  if (asset.priceSource === "manual") return false;
  if (asset.id.startsWith("morpho-")) return false;
  const symbol = asset.symbol.trim();
  if (!symbol || symbol.length > 12) return false;
  if (!/^[A-Z0-9.-]+$/i.test(symbol)) return false;
  if (isMorphoVaultShareSymbol(symbol)) return false;
  if (getFixedUsdPrice(symbol) != null || hasQuoteAlias(symbol)) return true;
  if (asset.walletId || asset.network || asset.protocol) return false;
  return true;
}

export type MarketQuotesResponse = {
  updated?: number;
  prices?: Record<string, number>;
  skipped?: string[];
  notFound?: string[];
  apiCalls?: number;
  coingeckoSymbols?: number;
  finnhubCalls?: number;
  yfinanceSymbols?: number;
  cacheHits?: number;
  lastRefreshAt?: string | null;
  sourcesByAsset?: Record<string, "coingecko" | "finnhub" | "yfinance" | "fixed">;
  providers?: { coingecko?: boolean; finnhub?: boolean; yfinance?: boolean };
  uniqueSymbols?: string[];
  message?: string;
  error?: string;
};
