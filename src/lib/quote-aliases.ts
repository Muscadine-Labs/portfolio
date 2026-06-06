/**
 * Quote symbol aliases — mirror of api-portfolio/src/lib/quote-aliases.ts
 */

export const STABLECOIN_USD_SYMBOLS = new Set([
  "USDC",
  "USDT",
  "DAI",
]);

export const QUOTE_SYMBOL_ALIASES: Record<string, string> = {
  CBTC: "BTC",
  CBBTC: "BTC",
  WETH: "ETH",
};

export const MORPHO_VAULT_SHARE_SYMBOLS = new Set([
  "MPCBTC",
  "MPWETH",
  "MPUSDC",
  "MVUSDC",
  "MVCBBTC",
  "MVWETH",
]);

export function normalizeQuoteSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase();
  return QUOTE_SYMBOL_ALIASES[upper] ?? upper;
}

export function getFixedUsdPrice(symbol: string): number | null {
  const upper = symbol.trim().toUpperCase();
  if (STABLECOIN_USD_SYMBOLS.has(upper)) return 1;
  return null;
}

export function isMorphoVaultShareSymbol(symbol: string): boolean {
  return MORPHO_VAULT_SHARE_SYMBOLS.has(symbol.trim().toUpperCase());
}

export function hasQuoteAlias(symbol: string): boolean {
  const upper = symbol.trim().toUpperCase();
  if (isMorphoVaultShareSymbol(upper)) return false;
  return (
    STABLECOIN_USD_SYMBOLS.has(upper) ||
    upper in QUOTE_SYMBOL_ALIASES ||
    getFixedUsdPrice(upper) != null
  );
}
