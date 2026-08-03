"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { UiPreferences } from "@/types";

const MORPHO_MODE_OPTIONS = [
  {
    value: "share_price",
    label: "Share price (price per vault share × vault tokens)",
  },
  {
    value: "underlying",
    label: "Underlying asset (BTC/WETH/USDC qty × spot price)",
  },
] as const;

const AUTO_ROUTE_OPTIONS = [
  {
    value: "cash_and_assets",
    label: "Cash + assets (USD stables → cash; else assets; debt → liabilities)",
  },
  {
    value: "assets",
    label: "Everything to assets (debt still → liabilities)",
  },
  {
    value: "manual",
    label: "Manual only (new Morpho positions need a mapping)",
  },
] as const;

export function WalletSyncSettingsCard() {
  const {
    uiPreferences,
    setMorphoVaultDisplayMode,
    setWalletSyncAutoRoute,
  } = usePortfolio();
  const mode: NonNullable<UiPreferences["morphoVaultDisplayMode"]> =
    uiPreferences.morphoVaultDisplayMode ?? "share_price";
  const autoRoute: NonNullable<UiPreferences["walletSyncAutoRoute"]> =
    uiPreferences.walletSyncAutoRoute ?? "cash_and_assets";

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Wallet sync</CardTitle>
        <CardDescription>
          Daily and manual sync: Morpho positions, Bitcoin (electrs), and how new
          rows are placed when you have not mapped them yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wallet-auto-route">New positions</Label>
          <NativeSelect
            id="wallet-auto-route"
            value={autoRoute}
            onValueChange={(value) => {
              if (
                value === "manual" ||
                value === "assets" ||
                value === "cash_and_assets"
              ) {
                setWalletSyncAutoRoute(value);
              }
            }}
            options={AUTO_ROUTE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
          <p className="text-xs text-muted-foreground">
            Explicit Morpho mappings still win. Disabled mappings stay off. Auto
            modes create mappings for newly seen Morpho positions so they land in
            Cash / Assets / Liabilities without a manual scan.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="morpho-vault-mode">Morpho vault display</Label>
          <NativeSelect
            id="morpho-vault-mode"
            value={mode}
            onValueChange={(value) => {
              if (value === "share_price" || value === "underlying") {
                setMorphoVaultDisplayMode(value);
              }
            }}
            options={MORPHO_MODE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}
