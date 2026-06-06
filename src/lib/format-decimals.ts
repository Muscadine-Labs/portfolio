import { isCryptoAssetSection } from "@/lib/asset-sections";
import { formatCurrency } from "@/lib/utils";
import type { Asset, PortfolioSection } from "@/types";

export const STOCK_DISPLAY_DECIMALS = 3;
export const CRYPTO_DISPLAY_DECIMALS = 8;
export const MAX_EDIT_DECIMALS = 8;

export function isCryptoAssetPosition(
  asset: Asset,
  section?: PortfolioSection | null
): boolean {
  if (section && isCryptoAssetSection(section)) return true;
  return Boolean(asset.network || asset.protocol || asset.walletId);
}

export function roundToDecimalPlaces(value: number, places: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Cap crypto inputs at 8 decimals; preserve full precision for stocks/traditional. */
export function sanitizeAssetDecimalInput(value: number, isCrypto: boolean): number {
  if (!Number.isFinite(value)) return 0;
  if (isCrypto) return roundToDecimalPlaces(value, MAX_EDIT_DECIMALS);
  return value;
}

/** Store and display prices with exactly two decimal places. */
export function sanitizeAssetPriceInput(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return roundToDecimalPlaces(value, 2);
}

export function formatQuantityDisplay(value: number, isCrypto: boolean): string {
  if (!Number.isFinite(value)) return "—";
  const max = isCrypto ? CRYPTO_DISPLAY_DECIMALS : STOCK_DISPLAY_DECIMALS;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  }).format(value);
}

export function formatUnitPriceDisplay(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
