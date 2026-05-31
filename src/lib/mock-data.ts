/**
 * Compute helpers only — portfolio rows come from the home API (api-portfolio).
 */
import type { CashAccount, Liability } from "@/types";
import { getMarketValue } from "@/lib/utils";

export function computeTotalCash(accounts: CashAccount[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function computeTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.balance, 0);
}

export function computeTotalInvestments(assets: import("@/types").Asset[]): number {
  return assets.reduce((sum, a) => sum + getMarketValue(a), 0);
}
