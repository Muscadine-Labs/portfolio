/**
 * Quote symbol aliases — mirror of api-portfolio/src/lib/quote-aliases.ts
 */

export const STABLECOIN_USD_SYMBOLS = new Set([
  "USDC",
  "MPUSDC",
  "USDT",
  "DAI",
]);

export const QUOTE_SYMBOL_ALIASES: Record<string, string> = {
  MPCBTC: "BTC",
  CBTC: "BTC",
  MPWETH: "ETH",
  WETH: "ETH",
  MPUSDC: "USDC",
};

export function normalizeQuoteSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase();
  return QUOTE_SYMBOL_ALIASES[upper] ?? upper;
}

export function getFixedUsdPrice(symbol: string): number | null {
  const upper = symbol.trim().toUpperCase();
  if (STABLECOIN_USD_SYMBOLS.has(upper)) return 1;
  return null;
}
