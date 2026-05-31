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
    const gain = getGain(asset);
    marketValue += mv;
    gainDollars += gain.dollars;
    costBasis += getCostBasis(asset) ?? mv;
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
