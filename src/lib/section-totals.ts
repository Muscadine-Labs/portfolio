import { getCostBasis, getGain, getMarketValue } from "@/lib/utils";
import type { Asset, CashAccount, Liability } from "@/types";

export interface AssetSectionTotals {
  marketValue: number;
  costBasis: number;
  gainDollars: number;
  gainPercent: number;
}

export function sumAssetSectionTotals(assets: Asset[]): AssetSectionTotals {
  let marketValue = 0;
  let costBasis = 0;
  let gainDollars = 0;

  for (const asset of assets) {
    const mv = getMarketValue(asset);
    marketValue += mv;
    const basis = getCostBasis(asset);
    if (basis == null) continue;
    costBasis += basis;
    const gain = getGain(asset);
    if (gain) gainDollars += gain.dollars;
  }

  const gainPercent = costBasis > 0 ? (gainDollars / costBasis) * 100 : 0;

  return { marketValue, costBasis, gainDollars, gainPercent };
}

export interface CashSectionTotals {
  balance: number;
  originalAmount: number;
  interest: number;
}

export function sumCashSectionTotals(accounts: CashAccount[]): CashSectionTotals {
  return {
    balance: accounts.reduce((sum, a) => sum + a.balance, 0),
    originalAmount: accounts.reduce((sum, a) => sum + (a.originalAmount ?? 0), 0),
    interest: accounts.reduce((sum, a) => sum + (a.interest ?? 0), 0),
  };
}

/**
 * Cash cost basis = money put in (initial balance), never accrued interest.
 * Falls back to balance − interest, then balance, when no initial amount is set.
 */
export function getCashCostBasis(account: CashAccount): number {
  if (account.originalAmount != null) return account.originalAmount;
  if (account.interest != null) return account.balance - account.interest;
  return account.balance;
}

export interface CashPageTotals {
  balance: number;
  costBasis: number;
  gainDollars: number;
  gainPercent: number;
}

export function sumCashPageTotals(accounts: CashAccount[]): CashPageTotals {
  const balance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const costBasis = accounts.reduce((sum, a) => sum + getCashCostBasis(a), 0);
  const gainDollars = balance - costBasis;
  const gainPercent = costBasis > 0 ? (gainDollars / costBasis) * 100 : 0;
  return { balance, costBasis, gainDollars, gainPercent };
}

export interface LiabilityPageTotals {
  totalDebt: number;
  initialDebt: number;
  /** Positive = debt paid down (good); negative = debt grew. */
  paidDownDollars: number;
  paidDownPercent: number;
}

export function sumLiabilityPageTotals(liabilities: Liability[]): LiabilityPageTotals {
  const totalDebt = liabilities.reduce((sum, l) => sum + l.balance, 0);
  const initialDebt = liabilities.reduce(
    (sum, l) => sum + (l.initialBalance ?? l.balance),
    0
  );
  const paidDownDollars = initialDebt - totalDebt;
  const paidDownPercent = initialDebt > 0 ? (paidDownDollars / initialDebt) * 100 : 0;
  return { totalDebt, initialDebt, paidDownDollars, paidDownPercent };
}

export interface LiabilitySectionTotals {
  totalDebt: number;
  initialBalance: number;
  interestAccrued: number;
  collateral: number;
}

export function sumLiabilitySectionTotals(
  liabilities: Liability[]
): LiabilitySectionTotals {
  return {
    totalDebt: liabilities.reduce((sum, l) => sum + l.balance, 0),
    initialBalance: liabilities.reduce((sum, l) => sum + (l.initialBalance ?? 0), 0),
    interestAccrued: liabilities.reduce((sum, l) => sum + (l.interestAccrued ?? 0), 0),
    collateral: liabilities.reduce((sum, l) => sum + (l.collateral ?? 0), 0),
  };
}
