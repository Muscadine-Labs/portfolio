"use client";

import { useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { MorphoSyncResult } from "@/lib/morpho";
import {
  detectWalletChain,
  isValidWalletAddress,
  morphoChainIdForWallet,
  normalizeEvmAddress,
} from "@/lib/wallet-address";
import type { ConnectedWallet, PageType, WalletChain } from "@/types";

const CHAIN_OPTIONS = [
  { value: "base", label: "Base" },
  { value: "ethereum", label: "Ethereum" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "other", label: "Other" },
] as const;

function createWalletId(): string {
  return `wallet-${Date.now().toString(36)}`;
}

function sectionOptionsForPage(
  sections: ReturnType<typeof usePortfolio>["sections"],
  page: PageType
) {
  return sections
    .filter((s) => s.page === page)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ value: s.id, label: s.label }));
}

export function ConnectedWalletsSettingsCard() {
  const portfolio = usePortfolio();
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<WalletChain>("base");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handlePasteAddress = (value: string) => {
    setAddress(value);
    if (!label.trim()) {
      const detected = detectWalletChain(value);
      if (detected !== "other") setChain(detected);
    }
  };

  const handleAddWallet = () => {
    const trimmedLabel = label.trim();
    const trimmedAddress = address.trim();
    if (!trimmedLabel) {
      toast.error("Label is required");
      return;
    }
    if (!isValidWalletAddress(trimmedAddress, chain)) {
      toast.error("Invalid address for the selected chain");
      return;
    }

    const wallet: ConnectedWallet = {
      id: createWalletId(),
      label: trimmedLabel,
      address:
        chain === "ethereum" || chain === "base"
          ? normalizeEvmAddress(trimmedAddress)
          : trimmedAddress,
      chain,
    };
    portfolio.upsertConnectedWallet(wallet);
    setLabel("");
    setAddress("");
    toast.success("Wallet added", { description: trimmedLabel });
  };

  const updateWalletLinks = (
    wallet: ConnectedWallet,
    key: keyof NonNullable<ConnectedWallet["links"]>,
    sectionId: string
  ) => {
    portfolio.upsertConnectedWallet({
      ...wallet,
      links: { ...wallet.links, [key]: sectionId || undefined },
    });
  };

  const syncMorpho = async (wallet: ConnectedWallet) => {
    const morphoChainId = morphoChainIdForWallet(wallet.chain);
    if (!morphoChainId) {
      toast.error("Morpho sync requires Ethereum or Base");
      return;
    }

    const assetsSectionId =
      wallet.links?.assetsSectionId ??
      portfolio.sections.find(
        (s) => s.page === "assets" && s.metadata?.walletId === wallet.id
      )?.id;
    const cashSectionId =
      wallet.links?.cashSectionId ??
      portfolio.sections.find((s) => s.page === "cash" && s.metadata?.walletId === wallet.id)?.id;
    const liabilitiesSectionId =
      wallet.links?.liabilitiesSectionId ??
      portfolio.sections.find(
        (s) => s.page === "liabilities" && s.metadata?.walletId === wallet.id
      )?.id;

    if (!assetsSectionId || !cashSectionId || !liabilitiesSectionId) {
      toast.error("Set all three section targets before syncing");
      return;
    }

    setSyncingId(wallet.id);
    try {
      const res = await fetch("/api/morpho/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.address,
          chain: wallet.chain,
          walletId: wallet.id,
          assetsSectionId,
          cashSectionId,
          liabilitiesSectionId,
        }),
      });
      const data = (await res.json()) as MorphoSyncResult & { error?: string };
      if (!res.ok) {
        toast.error("Morpho sync failed", { description: data.error });
        return;
      }
      portfolio.applyMorphoSync(wallet.id, data);
      const count =
        data.assets.length + data.liabilities.length + data.cashAccounts.length;
      toast.success("Morpho sync complete", {
        description: `Updated ${count} positions for ${wallet.label}`,
      });
    } catch {
      toast.error("Morpho sync failed", { description: "Could not reach the API." });
    } finally {
      setSyncingId(null);
    }
  };

  const assetSectionOptions = sectionOptionsForPage(portfolio.sections, "assets");
  const cashSectionOptions = sectionOptionsForPage(portfolio.sections, "cash");
  const liabilitySectionOptions = sectionOptionsForPage(portfolio.sections, "liabilities");

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Connected wallets</CardTitle>
        <CardDescription>
          Crypto is grouped by wallet, not network. Link each address to an assets section (one
          section per wallet), then sync Morpho on Base or Ethereum. Set network per position on
          the Assets page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-4">
          <p className="text-sm font-medium">Add wallet</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wallet-label">Label</Label>
              <Input
                id="wallet-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Main Ledger"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wallet-address">Address</Label>
              <Input
                id="wallet-address"
                value={address}
                onChange={(e) => handlePasteAddress(e.target.value)}
                placeholder="0x… or bc1…"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet-chain">Default sync network</Label>
              <NativeSelect
                id="wallet-chain"
                value={chain}
                onValueChange={(v) => setChain(v as WalletChain)}
                options={[...CHAIN_OPTIONS]}
              />
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddWallet}>
            <Plus className="mr-2 h-4 w-4" />
            Add wallet
          </Button>
        </div>

        {portfolio.connectedWallets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wallets connected yet.</p>
        ) : (
          <ul className="space-y-4">
            {portfolio.connectedWallets.map((wallet) => (
              <li
                key={wallet.id}
                className="space-y-3 rounded-lg border border-border/60 bg-background/40 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{wallet.label}</p>
                    <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                      {wallet.address}
                    </p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{wallet.chain}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive"
                    onClick={() => {
                      if (window.confirm(`Remove wallet "${wallet.label}"?`)) {
                        portfolio.deleteConnectedWallet(wallet.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Assets section</Label>
                    <NativeSelect
                      value={wallet.links?.assetsSectionId ?? ""}
                      onValueChange={(v) => updateWalletLinks(wallet, "assetsSectionId", v)}
                      options={[
                        { value: "", label: "—" },
                        ...assetSectionOptions,
                      ]}
                      placeholder="Select…"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cash section</Label>
                    <NativeSelect
                      value={wallet.links?.cashSectionId ?? ""}
                      onValueChange={(v) => updateWalletLinks(wallet, "cashSectionId", v)}
                      options={[{ value: "", label: "—" }, ...cashSectionOptions]}
                      placeholder="Select…"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Liabilities section</Label>
                    <NativeSelect
                      value={wallet.links?.liabilitiesSectionId ?? ""}
                      onValueChange={(v) =>
                        updateWalletLinks(wallet, "liabilitiesSectionId", v)
                      }
                      options={[
                        { value: "", label: "—" },
                        ...liabilitySectionOptions,
                      ]}
                      placeholder="Select…"
                    />
                  </div>
                </div>

                {morphoChainIdForWallet(wallet.chain) ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={syncingId === wallet.id}
                    onClick={() => void syncMorpho(wallet)}
                  >
                    {syncingId === wallet.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync Morpho positions
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Morpho sync is available on Ethereum and Base only.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
