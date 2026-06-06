"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { WalletMorphoMappingPanel } from "@/components/plan/WalletMorphoMappingPanel";
import { WalletNetworkToggles } from "@/components/plan/WalletNetworkToggles";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import { detectWalletNetworks } from "@/lib/wallet-address";
import {
  createWalletAddressEntryId,
  emptyWalletAddressEntry,
  hasSyncableWalletAddresses,
  validateWalletAddressEntries,
  walletLegacyFieldsFromEntries,
} from "@/lib/wallet-entries";
import { WALLET_TYPE_OPTIONS } from "@/lib/wallet-types";
import type {
  MorphoPositionMapping,
  WalletAddressEntry,
  WalletMapNode,
  WalletType,
} from "@/types";

const schema = z.object({
  label: z.string().min(1, "Name is required"),
  order: z.number().int().min(0, "Order must be 0 or greater"),
  walletType: z.string().optional(),
  status: z.enum(["active", "planned"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "planned", label: "Not created yet" },
] as const;

interface WalletMapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: WalletMapNode | null;
  parentId: string | null;
  parentLabel?: string;
  siblingCount: number;
  onSave: (node: WalletMapNode) => void;
}

function initialAddressEntries(node?: WalletMapNode | null): WalletAddressEntry[] {
  if (node?.addresses?.length) {
    return node.addresses.map((entry) => ({
      id: entry.id,
      address: entry.address,
      networks: entry.networks,
      label: entry.label,
    }));
  }

  const legacy = node?.address ?? node?.identifier ?? "";
  if (legacy.trim()) {
    return [
      {
        id: createWalletAddressEntryId(),
        address: legacy,
        networks:
          node?.networks?.length && node.networks.length > 0
            ? node.networks
            : detectWalletNetworks(legacy),
      },
    ];
  }

  return [emptyWalletAddressEntry()];
}

export function WalletMapDrawer({
  open,
  onOpenChange,
  node,
  parentId,
  parentLabel,
  siblingCount,
  onSave,
}: WalletMapDrawerProps) {
  const { getSections, assets, liabilities, cashAccounts } = usePortfolio();
  const assetSections = getSections("assets");
  const cashSections = getSections("cash");
  const liabilitySections = getSections("liabilities");

  const sectionOptions = useMemo(
    () => ({
      assets: assetSections.map((s) => ({ value: s.id, label: s.label })),
      cash: cashSections.map((s) => ({ value: s.id, label: s.label })),
      liabilities: liabilitySections.map((s) => ({ value: s.id, label: s.label })),
    }),
    [assetSections, cashSections, liabilitySections]
  );

  const [addressEntries, setAddressEntries] = useState<WalletAddressEntry[]>([
    emptyWalletAddressEntry(),
  ]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [assetsSectionId, setAssetsSectionId] = useState("");
  const [cashSectionId, setCashSectionId] = useState("");
  const [liabilitiesSectionId, setLiabilitiesSectionId] = useState("");
  const [linkedAssetIds, setLinkedAssetIds] = useState<string[]>([]);
  const [linkedLiabilityIds, setLinkedLiabilityIds] = useState<string[]>([]);
  const [morphoMappings, setMorphoMappings] = useState<MorphoPositionMapping[]>([]);

  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      order: 0,
      status: "active",
      walletType: "",
    },
  });

  const status = useWatch({ control, name: "status" });
  const walletType = useWatch({ control, name: "walletType" });

  const draftWallet = useMemo(
    (): WalletMapNode => ({
      id: node?.id ?? "draft",
      parentId: node?.parentId ?? parentId,
      label: "",
      order: 0,
      status: status ?? "active",
      addresses: addressEntries,
    }),
    [addressEntries, node?.id, node?.parentId, parentId, status]
  );

  const canSync = status === "active" && hasSyncableWalletAddresses(draftWallet);

  const assetsInLinkedSection = useMemo(
    () => (assetsSectionId ? assets.filter((a) => a.sectionId === assetsSectionId) : []),
    [assets, assetsSectionId]
  );

  const liabilitiesInLinkedSection = useMemo(
    () =>
      liabilitiesSectionId
        ? liabilities.filter((l) => l.sectionId === liabilitiesSectionId)
        : [],
    [liabilities, liabilitiesSectionId]
  );

  useDrawerFormReset(
    open,
    reset,
    () => {
      setAddressEntries(initialAddressEntries(node));
      setSyncEnabled(node?.syncEnabled ?? false);
      setAssetsSectionId(node?.links?.assetsSectionId ?? "");
      setCashSectionId(node?.links?.cashSectionId ?? "");
      setLiabilitiesSectionId(node?.links?.liabilitiesSectionId ?? "");
      setLinkedAssetIds(node?.links?.assetIds ?? []);
      setLinkedLiabilityIds(node?.links?.liabilityIds ?? []);
      setMorphoMappings(node?.morphoMappings ?? []);
      return {
        label: node?.label ?? "",
        order: node?.order ?? siblingCount,
        walletType: node?.walletType ?? "",
        status: node?.status ?? "active",
        notes: node?.notes ?? "",
      };
    },
    [node?.id, parentId, siblingCount]
  );

  const updateAddressEntry = (id: string, patch: Partial<WalletAddressEntry>) => {
    setAddressEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  };

  const handleAddressChange = (id: string, value: string) => {
    const trimmed = value.trim();
    setAddressEntries((entries) =>
      entries.map((entry) => {
        if (entry.id !== id) return entry;
        const networks = trimmed ? detectWalletNetworks(trimmed) : entry.networks;
        return { ...entry, address: value, networks };
      })
    );
  };

  const toggleLinkedAsset = (assetId: string) => {
    setLinkedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    );
  };

  const toggleLinkedLiability = (liabilityId: string) => {
    setLinkedLiabilityIds((current) =>
      current.includes(liabilityId)
        ? current.filter((id) => id !== liabilityId)
        : [...current, liabilityId]
    );
  };

  const onSubmit = (values: FormValues) => {
    const validation = validateWalletAddressEntries(addressEntries);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    const entries = validation.entries;
    const legacy = walletLegacyFieldsFromEntries(entries);

    const links = {
      assetsSectionId: assetsSectionId || undefined,
      cashSectionId: cashSectionId || undefined,
      liabilitiesSectionId: liabilitiesSectionId || undefined,
      assetIds: linkedAssetIds.length ? linkedAssetIds : undefined,
      liabilityIds: linkedLiabilityIds.length ? linkedLiabilityIds : undefined,
    };

    const hasLinks =
      links.assetsSectionId ||
      links.cashSectionId ||
      links.liabilitiesSectionId ||
      links.assetIds?.length ||
      links.liabilityIds?.length;

    if (syncEnabled && !hasLinks) {
      toast.error("Choose at least one target section before enabling sync.");
      return;
    }

    if (syncEnabled && entries.length === 0) {
      toast.error("Add at least one address before enabling sync.");
      return;
    }

    onSave({
      id: node?.id ?? createEntityId("wm"),
      parentId: node?.parentId ?? parentId,
      label: values.label.trim(),
      order: values.order,
      walletType: (values.walletType as WalletType) || undefined,
      address: legacy.address,
      networks: legacy.networks,
      addresses: entries.length ? entries : undefined,
      links: hasLinks ? links : undefined,
      morphoMappings: morphoMappings.length ? morphoMappings : undefined,
      syncEnabled: syncEnabled || undefined,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      owner: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {node ? "Edit wallet" : parentLabel ? `Add under ${parentLabel}` : "Add root wallet"}
          </DrawerTitle>
          <DrawerDescription>
            Add separate addresses per chain (BTC, SOL, EVM). Sync merges into linked section
            assets when symbols match.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_5rem]">
              <div className="space-y-2">
                <Label htmlFor="wallet-label">Label</Label>
                <Input
                  id="wallet-label"
                  {...register("label")}
                  placeholder="e.g. Ledger A"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-order">Order</Label>
                <Input
                  id="wallet-order"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  {...register("order", { valueAsNumber: true })}
                  aria-describedby="wallet-order-hint"
                />
              </div>
            </div>
            <p id="wallet-order-hint" className="text-xs text-muted-foreground">
              Sibling index among wallets at the same level (0, 1, 2…). Lower numbers appear first.
            </p>
            <div className="space-y-2">
              <Label htmlFor="wallet-type">Type</Label>
              <NativeSelect
                id="wallet-type"
                value={walletType}
                onValueChange={(value) => setValue("walletType", value)}
                options={WALLET_TYPE_OPTIONS}
                placeholder="Choose type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet-status">Status</Label>
              <NativeSelect
                id="wallet-status"
                value={status}
                onValueChange={(value) => setValue("status", value as FormValues["status"])}
                options={STATUS_OPTIONS}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Addresses</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() =>
                    setAddressEntries((entries) => [...entries, emptyWalletAddressEntry()])
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add address
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use one row per script type — e.g. bc1… for Bitcoin, a Solana address, and 0x… for
                Ethereum/Base.
              </p>
              {addressEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="space-y-2 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Address {index + 1}
                    </span>
                    {addressEntries.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() =>
                          setAddressEntries((entries) =>
                            entries.filter((row) => row.id !== entry.id)
                          )
                        }
                        aria-label="Remove address"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={entry.label ?? ""}
                    onChange={(event) =>
                      updateAddressEntry(entry.id, { label: event.target.value })
                    }
                    placeholder="Optional label (e.g. BTC cold)"
                    autoComplete="off"
                  />
                  <Input
                    value={entry.address}
                    onChange={(event) => handleAddressChange(entry.id, event.target.value)}
                    placeholder="0x…, bc1…, or Solana address"
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                  <WalletNetworkToggles
                    idPrefix={`wallet-drawer-${entry.id}`}
                    address={entry.address}
                    selected={entry.networks}
                    onChange={(networks) => updateAddressEntry(entry.id, { networks })}
                  />
                </div>
              ))}
            </div>

            {canSync ? (
              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <p className="text-sm font-medium">Section links (sync targets)</p>
                <div className="space-y-2">
                  <Label htmlFor="wallet-assets-section">Assets section</Label>
                  <NativeSelect
                    id="wallet-assets-section"
                    value={assetsSectionId}
                    onValueChange={setAssetsSectionId}
                    options={sectionOptions.assets}
                    placeholder="None"
                  />
                </div>
                {assetsSectionId && assetsInLinkedSection.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Merge into existing assets (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Checked assets receive synced balances (added on first sync, updated on
                      re-sync). Unchecked assets still match by symbol in the linked section.
                    </p>
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border/50 p-2">
                      {assetsInLinkedSection.map((asset) => (
                        <label
                          key={asset.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={linkedAssetIds.includes(asset.id)}
                            onChange={() => toggleLinkedAsset(asset.id)}
                            className="size-4 rounded border-input"
                          />
                          <span>
                            {asset.symbol}
                            {asset.network ? ` · ${asset.network}` : ""} — {asset.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="wallet-cash-section">Cash section</Label>
                  <NativeSelect
                    id="wallet-cash-section"
                    value={cashSectionId}
                    onValueChange={setCashSectionId}
                    options={sectionOptions.cash}
                    placeholder="None"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-liabilities-section">Liabilities section</Label>
                  <NativeSelect
                    id="wallet-liabilities-section"
                    value={liabilitiesSectionId}
                    onValueChange={setLiabilitiesSectionId}
                    options={sectionOptions.liabilities}
                    placeholder="None"
                  />
                </div>
                {liabilitiesSectionId && liabilitiesInLinkedSection.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Merge into existing liabilities (optional)</Label>
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border/50 p-2">
                      {liabilitiesInLinkedSection.map((liability) => (
                        <label
                          key={liability.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={linkedLiabilityIds.includes(liability.id)}
                            onChange={() => toggleLinkedLiability(liability.id)}
                            className="size-4 rounded border-input"
                          />
                          <span>{liability.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <WalletMorphoMappingPanel
                  addressEntries={addressEntries}
                  links={{
                    assetsSectionId: assetsSectionId || undefined,
                    cashSectionId: cashSectionId || undefined,
                    liabilitiesSectionId: liabilitiesSectionId || undefined,
                  }}
                  assetSections={assetSections}
                  liabilitySections={liabilitySections}
                  cashSections={cashSections}
                  assets={assets}
                  liabilities={liabilities}
                  cashAccounts={cashAccounts}
                  mappings={morphoMappings}
                  onChange={setMorphoMappings}
                />
                <label className="flex cursor-pointer items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-sm font-medium">Enable sync</span>
                    <p className="text-xs text-muted-foreground">
                      Import Morpho positions (and Bitcoin via electrs) into linked sections.
                    </p>
                  </div>
                  <input
                    id="wallet-sync-enabled"
                    type="checkbox"
                    checked={syncEnabled}
                    onChange={(e) => setSyncEnabled(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                </label>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="wallet-notes">Notes (optional)</Label>
              <Input
                id="wallet-notes"
                {...register("notes")}
                placeholder="Internal notes"
                autoComplete="off"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit">Save</Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
