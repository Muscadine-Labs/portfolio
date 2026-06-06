"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletMapDrawer } from "@/components/plan/WalletMapDrawer";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { formatWalletAddress } from "@/lib/asset-sections";
import { apiErrorMessage } from "@/lib/format-error";
import { validatePortfolioPayload } from "@/lib/portfolio-data";
import { walletNetworkLabel } from "@/lib/wallet-address";
import {
  getWalletAddressEntries,
  getWalletAllNetworks,
  hasSyncableWalletAddresses,
} from "@/lib/wallet-entries";
import { getWalletChildren, isOnChainWallet } from "@/lib/wallet-map";
import { walletTypeLabel } from "@/lib/wallet-types";
import { cn } from "@/lib/utils";
import type { WalletMapNode } from "@/types";

function WalletRow({
  node,
  nodes,
  depth,
  onEdit,
  onAddChild,
  onDelete,
  onSync,
  syncingId,
}: {
  node: WalletMapNode;
  nodes: WalletMapNode[];
  depth: number;
  onEdit: (node: WalletMapNode) => void;
  onAddChild: (parent: WalletMapNode) => void;
  onDelete: (id: string) => void;
  onSync: (node: WalletMapNode) => void;
  syncingId: string | null;
}) {
  const children = getWalletChildren(nodes, node.id);
  const isPlanned = node.status === "planned";
  const typeLabel = walletTypeLabel(node.walletType);
  const canSync = node.syncEnabled && hasSyncableWalletAddresses(node) && node.status === "active";
  const addressEntries = getWalletAddressEntries(node);
  const allNetworks = getWalletAllNetworks(node);

  return (
    <>
      <div
        className={cn(
          "space-y-2 rounded-lg border px-3 py-2 text-sm",
          isPlanned
            ? "border-border/30 bg-muted/20 text-muted-foreground"
            : "border-border/50 bg-background/60"
        )}
        style={{ marginLeft: depth * 14 }}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="min-w-[1.75rem] justify-center font-mono text-[10px] tabular-nums"
                title="Order among siblings at this level"
              >
                {node.order}
              </Badge>
              <span className="font-medium">{node.label}</span>
              {typeLabel ? (
                <Badge variant="secondary" className="text-[10px]">
                  {typeLabel}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  isPlanned ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {isPlanned ? "Not created" : "Active"}
              </Badge>
              {node.syncEnabled ? (
                <Badge variant="outline" className="text-[10px] text-sky-600 dark:text-sky-400">
                  Sync on
                </Badge>
              ) : null}
              {allNetworks.map((network) => (
                <Badge key={network} variant="outline" className="text-[10px]">
                  {walletNetworkLabel(network)}
                </Badge>
              ))}
            </div>
            {isOnChainWallet(node) ? (
              <div className="mt-0.5 space-y-0.5">
                {addressEntries.length === 1 ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatWalletAddress(node.address ?? addressEntries[0].address)}
                  </p>
                ) : (
                  addressEntries.map((entry) => (
                    <p key={entry.id} className="font-mono text-xs text-muted-foreground">
                      {entry.label ? `${entry.label}: ` : ""}
                      {formatWalletAddress(entry.address)}
                    </p>
                  ))
                )}
              </div>
            ) : null}
            {node.links?.assetsSectionId ||
            node.links?.cashSectionId ||
            node.links?.liabilitiesSectionId ||
            node.links?.assetIds?.length ||
            node.links?.liabilityIds?.length ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Linked sections
                {node.links?.assetIds?.length
                  ? ` · ${node.links.assetIds.length} asset(s)`
                  : ""}
                {node.links?.liabilityIds?.length
                  ? ` · ${node.links.liabilityIds.length} liability row(s)`
                  : ""}
              </p>
            ) : null}
            {node.notes ? (
              <p className="mt-0.5 text-xs text-muted-foreground/90">{node.notes}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            {canSync ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={syncingId === node.id}
                onClick={() => onSync(node)}
                title="Sync tokens and Morpho positions"
                aria-label={`Sync wallet ${node.label}`}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", syncingId === node.id && "animate-spin")}
                />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddChild(node)}
              title="Add child wallet"
              aria-label={`Add child wallet under ${node.label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(node)}
              aria-label={`Edit wallet ${node.label}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(node.id)}
              aria-label={`Delete wallet ${node.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      {children.map((child) => (
        <WalletRow
          key={child.id}
          node={child}
          nodes={nodes}
          depth={depth + 1}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onSync={onSync}
          syncingId={syncingId}
        />
      ))}
    </>
  );
}

export function WalletMapGuide() {
  const { walletMapNodes, upsertWalletMapNode, deleteWalletMapNode, replacePortfolioData } =
    usePortfolio();
  const roots = useMemo(() => getWalletChildren(walletMapNodes, null), [walletMapNodes]);
  const syncableCount = useMemo(
    () =>
      walletMapNodes.filter(
        (w) => w.syncEnabled && w.status === "active" && hasSyncableWalletAddresses(w)
      ).length,
    [walletMapNodes]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WalletMapNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string | undefined>();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const reloadPortfolio = async () => {
    const res = await fetch("/api/export");
    const body = await res.json();
    if (!res.ok) {
      throw new Error(apiErrorMessage(body.error, "Could not reload portfolio"));
    }
    const validated = validatePortfolioPayload(body);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    replacePortfolioData(validated.data);
  };

  const syncWallet = async (node: WalletMapNode) => {
    setSyncingId(node.id);
    try {
      const res = await fetch("/api/wallets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId: node.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Wallet sync failed", {
          description: apiErrorMessage(data.error, "Unknown error"),
        });
        return;
      }
      await reloadPortfolio();
      toast.success("Wallet synced", {
        description: `${data.tokensAdded ?? 0} token(s), ${data.vaultsAdded ?? 0} vault row(s), ${data.liabilitiesAdded ?? 0} liability row(s) added.`,
      });
    } catch (err) {
      toast.error("Wallet sync failed", {
        description: err instanceof Error ? err.message : "Could not reach the server.",
      });
    } finally {
      setSyncingId(null);
    }
  };

  const syncAllWallets = async () => {
    if (syncableCount === 0) {
      toast.message("No wallets to sync", {
        description: "Enable sync on an active wallet with an address and section links.",
      });
      return;
    }
    setSyncingAll(true);
    try {
      const res = await fetch("/api/wallets/sync", { method: "PUT" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Wallet sync failed", {
          description: apiErrorMessage(data.error, "Unknown error"),
        });
        return;
      }
      await reloadPortfolio();
      toast.success("Wallets synced", {
        description: `${data.walletsSynced ?? 0} wallet(s) · ${data.tokensAdded ?? 0} token(s) · ${data.vaultsAdded ?? 0} vault row(s).`,
      });
    } catch (err) {
      toast.error("Wallet sync failed", {
        description: err instanceof Error ? err.message : "Could not reach the server.",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const openAdd = (pid: string | null, label?: string) => {
    setEditing(null);
    setParentId(pid);
    setParentLabel(label);
    setDrawerOpen(true);
  };

  const openEdit = (node: WalletMapNode) => {
    setEditing(node);
    setParentId(node.parentId);
    setParentLabel(undefined);
    setDrawerOpen(true);
  };

  const siblingCount = parentId
    ? getWalletChildren(walletMapNodes, parentId).length
    : roots.length;

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Wallets</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organize wallets in a tree. Link Ethereum/Base wallets to portfolio sections and
                sync Morpho on Ethereum/Base and Bitcoin via electrs.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {syncableCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncingAll}
                  onClick={() => void syncAllWallets()}
                >
                  <RefreshCw className={cn("mr-1 h-4 w-4", syncingAll && "animate-spin")} />
                  Sync all
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => openAdd(null)}>
                <Plus className="mr-1 h-4 w-4" />
                Add root
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {roots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No wallets yet. Add a family or personal root.
            </p>
          ) : (
            roots.map((root) => (
              <WalletRow
                key={root.id}
                node={root}
                nodes={walletMapNodes}
                depth={0}
                onEdit={openEdit}
                onAddChild={(node) => openAdd(node.id, node.label)}
                onDelete={deleteWalletMapNode}
                onSync={(node) => void syncWallet(node)}
                syncingId={syncingId}
              />
            ))
          )}
        </CardContent>
      </Card>

      <WalletMapDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        node={editing}
        parentId={parentId}
        parentLabel={parentLabel}
        siblingCount={siblingCount}
        onSave={upsertWalletMapNode}
      />
    </div>
  );
}
