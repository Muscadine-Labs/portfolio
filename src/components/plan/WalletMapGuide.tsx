"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletMapDrawer } from "@/components/plan/WalletMapDrawer";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { getWalletChildren } from "@/lib/wallet-map";
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
}: {
  node: WalletMapNode;
  nodes: WalletMapNode[];
  depth: number;
  onEdit: (node: WalletMapNode) => void;
  onAddChild: (parent: WalletMapNode) => void;
  onDelete: (id: string) => void;
}) {
  const children = getWalletChildren(nodes, node.id);
  const isPlanned = node.status === "planned";
  const typeLabel = walletTypeLabel(node.walletType);

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
          isPlanned
            ? "border-border/30 bg-muted/20 text-muted-foreground"
            : "border-border/50 bg-background/60"
        )}
        style={{ marginLeft: depth * 14 }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{node.label}</span>
            {node.owner && (
              <Badge variant="outline" className="text-[10px]">
                {node.owner}
              </Badge>
            )}
            {typeLabel && (
              <Badge variant="secondary" className="text-[10px]">
                {typeLabel}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                isPlanned ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isPlanned ? "Not created" : "Active"}
            </Badge>
          </div>
          {node.identifier && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{node.identifier}</p>
          )}
          {node.notes && <p className="mt-0.5 text-xs text-muted-foreground/90">{node.notes}</p>}
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
      {children.map((child) => (
        <WalletRow
          key={child.id}
          node={child}
          nodes={nodes}
          depth={depth + 1}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

export function WalletMapGuide() {
  const { walletMapNodes, upsertWalletMapNode, deleteWalletMapNode } = usePortfolio();
  const roots = useMemo(() => getWalletChildren(walletMapNodes, null), [walletMapNodes]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WalletMapNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string | undefined>();

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
              <CardTitle className="text-base">Wallet & key map</CardTitle>
              <p className="text-sm text-muted-foreground">
                Per-person wallets and types (mock data — editable). No passwords stored here.
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
            <p className="text-sm text-muted-foreground">No wallets yet. Add a family or personal root.</p>
          ) : (
            roots.map((root) => (
              <WalletRow
                key={root.id}
                node={root}
                nodes={walletMapNodes}
                depth={0}
                onEdit={openEdit}
                onAddChild={(n) => openAdd(n.id, n.label)}
                onDelete={deleteWalletMapNode}
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
