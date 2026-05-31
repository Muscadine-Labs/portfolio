"use client";

import { useMemo } from "react";
import { getCompatibleWalletNetworks, normalizeWalletNetworks, WALLET_NETWORK_OPTIONS } from "@/lib/wallet-address";
import { cn } from "@/lib/utils";
import type { WalletChain } from "@/types";

export function WalletNetworkToggles({
  address,
  selected,
  onChange,
  idPrefix,
}: {
  address: string;
  selected: WalletChain[];
  onChange: (networks: WalletChain[]) => void;
  idPrefix: string;
}) {
  const compatible = useMemo(
    () => new Set(getCompatibleWalletNetworks(address)),
    [address]
  );
  const hasAddress = address.trim().length > 0;

  const toggle = (network: WalletChain) => {
    const next = new Set(selected);
    if (next.has(network)) {
      if (next.size > 1) next.delete(network);
    } else {
      next.add(network);
    }
    onChange(normalizeWalletNetworks([...next]));
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {WALLET_NETWORK_OPTIONS.map(({ value, label }) => {
        const enabled = !hasAddress || compatible.has(value);
        const on = selected.includes(value);
        return (
          <button
            key={value}
            id={`${idPrefix}-${value}`}
            type="button"
            disabled={!enabled}
            onClick={() => toggle(value)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground",
              !enabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
