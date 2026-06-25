"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  WALLET_NETWORK_OPTIONS,
  detectWalletNetworks,
  getCompatibleWalletNetworks,
  walletNetworkLabel,
} from "@/lib/wallet-address";
import {
  createWalletAddressEntryId,
  emptyWalletAddressEntry,
  getWalletAddressEntries,
} from "@/lib/wallet-entries";
import type { WalletAddressEntry, WalletChain, WalletMapNode } from "@/types";
import { cn } from "@/lib/utils";

interface WalletAddressEntriesEditorProps {
  entries: WalletAddressEntry[];
  onChange: (entries: WalletAddressEntry[]) => void;
}

function toggleNetwork(
  entry: WalletAddressEntry,
  network: WalletChain,
  enabled: boolean
): WalletAddressEntry {
  const compatible = new Set(getCompatibleWalletNetworks(entry.address));
  if (!compatible.has(network)) return entry;
  const next = new Set(entry.networks);
  if (enabled) next.add(network);
  else next.delete(network);
  return { ...entry, networks: [...next] };
}

export function initialWalletAddressEntries(node?: WalletMapNode | null): WalletAddressEntry[] {
  if (!node) return [emptyWalletAddressEntry()];
  const existing = getWalletAddressEntries(node);
  if (existing.length === 0) return [emptyWalletAddressEntry()];
  return existing.map((entry) => ({
    ...entry,
    id: entry.id === "legacy" ? createWalletAddressEntryId() : entry.id,
  }));
}

export function WalletAddressEntriesEditor({
  entries,
  onChange,
}: WalletAddressEntriesEditorProps) {
  const updateEntry = (id: string, patch: Partial<WalletAddressEntry>) => {
    onChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  };

  const updateAddress = (id: string, address: string) => {
    onChange(
      entries.map((entry) => {
        if (entry.id !== id) return entry;
        if (!address.trim()) {
          return { ...entry, address, networks: [] };
        }
        const compatible = new Set(getCompatibleWalletNetworks(address));
        const suggested = detectWalletNetworks(address);
        const kept = entry.networks.filter((n) => compatible.has(n));
        const networks = kept.length > 0 ? kept : suggested;
        return { ...entry, address, networks };
      })
    );
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) {
      onChange([emptyWalletAddressEntry()]);
      return;
    }
    onChange(entries.filter((entry) => entry.id !== id));
  };

  const addEntry = () => {
    onChange([...entries, emptyWalletAddressEntry()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Addresses &amp; chains</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add address
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add one row per address. Select every chain where you hold assets so nothing is missed
        during sync.
      </p>
      {entries.map((entry, index) => {
        const compatible = getCompatibleWalletNetworks(entry.address);
        return (
          <div
            key={entry.id}
            className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Address {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => removeEntry(entry.id)}
                aria-label="Remove address"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`wallet-label-${entry.id}`}>Label (optional)</Label>
              <Input
                id={`wallet-label-${entry.id}`}
                value={entry.label ?? ""}
                onChange={(event) => updateEntry(entry.id, { label: event.target.value })}
                placeholder="e.g. Ledger, Coinbase"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`wallet-address-${entry.id}`}>Address</Label>
              <Input
                id={`wallet-address-${entry.id}`}
                value={entry.address}
                onChange={(event) => updateAddress(entry.id, event.target.value)}
                placeholder="0x…, bc1…, or Solana address"
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Chains</Label>
              <div className="flex flex-wrap gap-2">
                {WALLET_NETWORK_OPTIONS.map((option) => {
                  const supported = compatible.includes(option.value);
                  const checked = entry.networks.includes(option.value);
                  return (
                    <label
                      key={`${entry.id}-${option.value}`}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
                        supported
                          ? checked
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/60 bg-background/80 text-muted-foreground"
                          : "cursor-not-allowed border-border/30 bg-muted/30 text-muted-foreground/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-input"
                        checked={checked}
                        disabled={!supported || !entry.address.trim()}
                        onChange={(event) =>
                          onChange(
                            entries.map((row) =>
                              row.id === entry.id
                                ? toggleNetwork(row, option.value, event.target.checked)
                                : row
                            )
                          )
                        }
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {entry.address.trim() && entry.networks.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Select at least one chain for this address.
                </p>
              ) : null}
              {entry.networks.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {entry.networks.map((network) => (
                    <Badge key={`${entry.id}-badge-${network}`} variant="outline" className="text-[10px]">
                      {walletNetworkLabel(network)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
