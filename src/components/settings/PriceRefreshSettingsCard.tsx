"use client";

import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoTenant } from "@/lib/demo-constants";
import { apiErrorMessage } from "@/lib/format-error";
import { isFinnhubEligible, type MarketQuotesResponse } from "@/lib/finnhub";

function formatRefreshTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PriceRefreshSettingsCard() {
  const { assets, applyAssetPrices, account } = usePortfolio();
  const isDemo = isDemoTenant(account.tenant);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const eligibleCount = assets.filter(isFinnhubEligible).length;

  const loadStatus = useCallback(async () => {
    if (isDemo) return;
    try {
      const res = await fetch("/api/market/quotes", { method: "GET" });
      if (!res.ok) return;
      const data = (await res.json()) as { lastRefreshAt?: string | null };
      setLastRefreshAt(data.lastRefreshAt ?? null);
    } catch {
      /* status optional */
    }
  }, [isDemo]);

  const refreshPrices = async () => {
    if (isDemo) {
      toast.message("Demo mode", { description: "Sample prices are fixed." });
      return;
    }
    if (eligibleCount === 0) {
      toast.message("No assets to refresh", {
        description:
          "Add stocks, ETFs, or metals with API pricing (not manual-only wallet rows).",
      });
      return;
    }

    setRefreshing(true);
    try {
      const res = await fetch("/api/market/quotes", { method: "POST" });
      const data = (await res.json()) as MarketQuotesResponse;
      if (!res.ok) {
        toast.error("Price refresh failed", {
          description: apiErrorMessage(data.error, "Unknown error"),
        });
        return;
      }

      const prices = data.prices ?? {};
      const updated = applyAssetPrices(prices);
      setLastRefreshAt(data.lastRefreshAt ?? new Date().toISOString());

      const parts: string[] = [];
      if (updated > 0) parts.push(`${updated} price${updated === 1 ? "" : "s"} updated`);
      if ((data.notFound?.length ?? 0) > 0) {
        parts.push(`${data.notFound!.length} symbol(s) not found`);
      }
      if (typeof data.cacheHits === "number" && data.cacheHits > 0) {
        parts.push(`${data.cacheHits} from shared cache`);
      }
      if (typeof data.finnhubCalls === "number" && data.finnhubCalls > 0) {
        parts.push(`${data.finnhubCalls} Finnhub`);
      }
      if (typeof data.yfinanceSymbols === "number" && data.yfinanceSymbols > 0) {
        parts.push(`Yahoo (${data.yfinanceSymbols})`);
      }

      toast.success("Prices refreshed", {
        description: parts.length > 0 ? parts.join(" · ") : data.message ?? "No changes",
      });
    } catch {
      toast.error("Price refresh failed", { description: "Could not reach the server." });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Market prices</CardTitle>
        <CardDescription>
          Refresh stock, ETF, metal, and crypto prices from the home API. Scheduled refresh runs
          daily at 4:00 AM with shared caching across accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Last updated: </span>
            <span className="font-medium">{formatRefreshTime(lastRefreshAt)}</span>
          </p>
          <p className="text-muted-foreground">
            {eligibleCount} eligible holding{eligibleCount === 1 ? "" : "s"} · cbBTC/CBTC/CBBTC → BTC,
            WETH → ETH · USDC/USDT/DAI → $1
          </p>
          {!lastRefreshAt && !isDemo ? (
            <button
              type="button"
              className="text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => void loadStatus()}
            >
              Load last refresh time
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isDemo || refreshing || eligibleCount === 0}
          onClick={() => void refreshPrices()}
        >
          <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh prices
        </Button>
      </CardContent>
    </Card>
  );
}
