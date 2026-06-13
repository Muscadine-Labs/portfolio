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

export const CRYPTO_FINNHUB_SYMBOLS: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  XRP: "BINANCE:XRPUSDT",
  WSTETH: "BINANCE:WSTETHUSDT",
};

/** CoinGecko coin ids — primary source for crypto spot prices (backend). */
export const CRYPTO_COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  WSTETH: "wrapped-steth",
  LINK: "chainlink",
  AERO: "aerodrome-finance",
  VIRTUAL: "virtual-protocol",
  MORPHO: "morpho",
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

export function isCryptoSpotSymbol(symbol: string): boolean {
  const normalized = normalizeQuoteSymbol(symbol.trim().toUpperCase());
  return normalized in CRYPTO_COINGECKO_IDS || normalized in CRYPTO_FINNHUB_SYMBOLS;
}

export function getFinnhubQuoteSymbol(symbol: string): string {
  const normalized = normalizeQuoteSymbol(symbol.trim().toUpperCase());
  return CRYPTO_FINNHUB_SYMBOLS[normalized] ?? normalized;
}

export function resolveSpotTicker(symbol: string): string | null {
  const upper = symbol.trim().toUpperCase();
  if (isMorphoVaultShareSymbol(upper)) return null;
  const normalized = normalizeQuoteSymbol(upper);
  if (isCryptoSpotSymbol(normalized)) return normalized;
  return null;
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
    isCryptoSpotSymbol(upper) ||
    getFixedUsdPrice(upper) != null
  );
}
