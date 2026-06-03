"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeOverviewSnapshot } from "@/lib/overview";
import { formatCurrency } from "@/lib/utils";

export function HeaderNetWorthPill() {
  const { assets, cashAccounts, liabilities, getSections, sectionGroups } = usePortfolio();

  const netWorth = useMemo(() => {
    const snapshot = computeOverviewSnapshot(
      assets,
      cashAccounts,
      liabilities,
      getSections("assets"),
      getSections("cash"),
      getSections("liabilities"),
      sectionGroups
    );
    return snapshot.netWorth;
  }, [assets, cashAccounts, liabilities, getSections, sectionGroups]);

  return (
    <Link
      href="/dashboard"
      className="hidden rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium tabular-nums transition-colors hover:bg-muted/50 sm:inline-flex"
      title="Net worth"
    >
      {formatCurrency(netWorth, { maximumFractionDigits: 0 })}
    </Link>
  );
}
