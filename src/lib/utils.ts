import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAppHostname } from "@/lib/site";
import type { Asset } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  options?: { compact?: boolean; maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  const { compact = false, maximumFractionDigits = 2, minimumFractionDigits } = options ?? {};
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  const maxDigits = Math.max(0, Math.min(20, maximumFractionDigits));
  const minDigits = Math.max(
    0,
    Math.min(maxDigits, minimumFractionDigits ?? Math.min(2, maxDigits))
  );
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

export function formatPercent(
  value: number,
  digits = 2,
  options?: { signed?: boolean }
): string {
  const signed = options?.signed !== false;
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Round to two decimal places for cost / gain columns. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoneyColumn(value: number): string {
  return formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getMarketValue(asset: Asset): number {
  return asset.price * asset.quantity;
}

/** Total amount paid (cost basis). */
export function getCostBasis(asset: Asset): number | null {
  if (asset.costBasis == null) return null;
  return asset.costBasis;
}

/** Average cost per share/unit = cost basis ÷ quantity. */
export function getAverageCost(asset: Asset): number | null {
  if (asset.costBasis == null || asset.quantity === 0) return null;
  return asset.costBasis / asset.quantity;
}

export function getGain(asset: Asset): { dollars: number; percent: number } | null {
  if (asset.costBasis == null) return null;
  const marketValue = getMarketValue(asset);
  const dollars = marketValue - asset.costBasis;
  const percent = asset.costBasis === 0 ? 0 : (dollars / asset.costBasis) * 100;
  return { dollars, percent };
}

export function getGainColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-muted-foreground";
}

export function capitalizeTenant(tenant: string): string {
  return tenant.charAt(0).toUpperCase() + tenant.slice(1).toLowerCase();
}

/** @deprecated Tenant is not derived from hostname; use session / x-tenant. */
export function getTenantFromHost(): string | null {
  return null;
}

/** @deprecated Single app URL — see `isAppHostname` in `@/lib/site`. */
export function isRootDomain(host: string): boolean {
  return isAppHostname(host.split(":")[0]);
}
