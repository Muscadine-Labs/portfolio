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

export function WalletSyncSettingsCard() {
  const { uiPreferences, setMorphoVaultDisplayMode } = usePortfolio();
  const mode: NonNullable<UiPreferences["morphoVaultDisplayMode"]> =
    uiPreferences.morphoVaultDisplayMode ?? "share_price";

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Morpho sync</CardTitle>
        <CardDescription>
          How Morpho vault rows appear when synced (share price vs underlying asset).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="morpho-vault-mode">Morpho vault display</Label>
        <NativeSelect
          id="morpho-vault-mode"
          value={mode}
          onValueChange={(value) => {
            if (value === "share_price" || value === "underlying") {
              setMorphoVaultDisplayMode(value);
            }
          }}
          options={MORPHO_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </CardContent>
    </Card>
  );
}
