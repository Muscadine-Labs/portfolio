"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletMapDrawer } from "@/components/plan/WalletMapDrawer";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { formatWalletAddress } from "@/lib/asset-sections";
import type { MorphoSyncResult } from "@/lib/morpho";
import {
  getMorphoWalletNetworks,
  walletNetworkLabel,
} from "@/lib/wallet-address";
import { getWalletChildren, isOnChainWallet } from "@/lib/wallet-map";
import { walletTypeLabel } from "@/lib/wallet-types";
import { cn } from "@/lib/utils";
import type { WalletMapNode } from "@/types";

function WalletRow({
  node,
  nodes,
  depth,
  syncingKey,
  onEdit,
  onAddChild,
  onDelete,
  onSyncMorpho,
}: {
  node: WalletMapNode;
  nodes: WalletMapNode[];
  depth: number;
  syncingKey: string | null;
  onEdit: (node: WalletMapNode) => void;
  onAddChild: (parent: WalletMapNode) => void;
  onDelete: (id: string) => void;
  onSyncMorpho: (node: WalletMapNode, network: "ethereum" | "base") => void;
}) {
  const children = getWalletChildren(nodes, node.id);
  const isPlanned = node.status === "planned";
  const typeLabel = walletTypeLabel(node.walletType);
  const morphoNetworks = getMorphoWalletNetworks(node.networks ?? []);

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
              {node.networks?.map((network) => (
                <Badge key={network} variant="outline" className="text-[10px]">
                  {walletNetworkLabel(network)}
                </Badge>
              ))}
            </div>
            {isOnChainWallet(node) ? (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {formatWalletAddress(node.address!)}
              </p>
            ) : null}
            {node.notes ? (
              <p className="mt-0.5 text-xs text-muted-foreground/90">{node.notes}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddChild(node)}
              title="Add child wallet"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(node)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {morphoNetworks.length > 0 && isOnChainWallet(node) ? (
          <div className="flex flex-wrap gap-2">
            {morphoNetworks.map((network) => {
              const syncKey = `${node.id}:${network}`;
              const syncing = syncingKey === syncKey;
              return (
                <Button
                  key={network}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={syncing}
                  onClick={() => onSyncMorpho(node, network)}
                >
                  {syncing ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Sync Morpho · {walletNetworkLabel(network)}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
      {children.map((child) => (
        <WalletRow
          key={child.id}
          node={child}
          nodes={nodes}
          depth={depth + 1}
          syncingKey={syncingKey}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onSyncMorpho={onSyncMorpho}
        />
      ))}
    </>
  );
}

export function WalletMapGuide() {
  const { walletMapNodes, sections, upsertWalletMapNode, deleteWalletMapNode, applyMorphoSync } =
    usePortfolio();
  const roots = useMemo(() => getWalletChildren(walletMapNodes, null), [walletMapNodes]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WalletMapNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string | undefined>();
  const [syncingKey, setSyncingKey] = useState<string | null>(null);

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

  const syncMorpho = async (node: WalletMapNode, network: "ethereum" | "base") => {
    if (!node.address) return;

    const assetsSectionId =
      node.links?.assetsSectionId ??
      sections.find((section) => section.page === "assets" && section.metadata?.walletId === node.id)
        ?.id;
    const cashSectionId =
      node.links?.cashSectionId ??
      sections.find((section) => section.page === "cash" && section.metadata?.walletId === node.id)
        ?.id;
    const liabilitiesSectionId =
      node.links?.liabilitiesSectionId ??
      sections.find(
        (section) => section.page === "liabilities" && section.metadata?.walletId === node.id
      )?.id;

    if (!assetsSectionId || !cashSectionId || !liabilitiesSectionId) {
      toast.error("Set all three section targets on this wallet before syncing");
      return;
    }

    const syncKey = `${node.id}:${network}`;
    setSyncingKey(syncKey);
    try {
      const res = await fetch("/api/morpho/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: node.address,
          chain: network,
          walletId: node.id,
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
      applyMorphoSync(node.id, data);
      const count =
        data.assets.length + data.liabilities.length + data.cashAccounts.length;
      toast.success("Morpho sync complete", {
        description: `Updated ${count} positions on ${walletNetworkLabel(network)}`,
      });
    } catch {
      toast.error("Morpho sync failed", { description: "Could not reach the API." });
    } finally {
      setSyncingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Wallets</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organize wallets in a tree. Active wallets can include an address, networks, linked
                portfolio sections, and Morpho sync.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openAdd(null)}>
              <Plus className="mr-1 h-4 w-4" />
              Add root
            </Button>
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
                syncingKey={syncingKey}
                onEdit={openEdit}
                onAddChild={(node) => openAdd(node.id, node.label)}
                onDelete={deleteWalletMapNode}
                onSyncMorpho={(node, network) => void syncMorpho(node, network)}
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
