import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAppHostname } from "@/lib/site";
import type { Asset } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  options?: { compact?: boolean; maximumFractionDigits?: number }
): string {
  const { compact = false, maximumFractionDigits = 2 } = options ?? {};
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
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

export function getGain(asset: Asset): { dollars: number; percent: number } {
  const marketValue = getMarketValue(asset);
  const costBasis = asset.costBasis ?? marketValue;
  const dollars = marketValue - costBasis;
  const percent = costBasis === 0 ? 0 : (dollars / costBasis) * 100;
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
