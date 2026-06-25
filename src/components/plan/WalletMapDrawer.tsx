"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  WalletAddressEntriesEditor,
  initialWalletAddressEntries,
} from "@/components/plan/WalletAddressEntriesEditor";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import { validateWalletAddressEntries, walletLegacyFieldsFromEntries } from "@/lib/wallet-entries";
import { isWalletSyncSection } from "@/lib/wallet-sync-sections";
import { normalizeMorphoMappings, ensureWalletSyncSectionForTarget } from "@/lib/morpho-mapping-utils";
import type {
  MorphoPositionMapping,
  MorphoPositionTarget,
  WalletAddressEntry,
  WalletMapNode,
} from "@/types";

const schema = z.object({
  label: z.string().min(1, "Name is required"),
  order: z.number().int().min(0, "Order must be 0 or greater"),
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

function hasMorphoCapableAddress(entries: WalletAddressEntry[]): boolean {
  return entries.some(
    (entry) =>
      /^0x[a-fA-F0-9]{40}$/.test(entry.address.trim()) &&
      entry.networks.some((network) => network === "ethereum" || network === "base")
  );
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
  const { getSections, assets, liabilities, cashAccounts, sections, upsertSection } = usePortfolio();
  const assetSections = getSections("assets");
  const liabilitySections = getSections("liabilities");
  const cashSections = getSections("cash");

  const [addressEntries, setAddressEntries] = useState<WalletAddressEntry[]>([
    ...initialWalletAddressEntries(null),
  ]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [morphoMappings, setMorphoMappings] = useState<MorphoPositionMapping[]>([]);

  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      order: 0,
      status: "active",
    },
  });

  const status = useWatch({ control, name: "status" });

  const preparedEntries = useMemo(
    () => addressEntries.filter((entry) => entry.address.trim().length > 0),
    [addressEntries]
  );

  const canSync = status === "active" && hasMorphoCapableAddress(preparedEntries);

  useDrawerFormReset(
    open,
    reset,
    () => {
      setAddressEntries(initialWalletAddressEntries(node));
      setSyncEnabled(node?.syncEnabled ?? false);
      setMorphoMappings(
        normalizeMorphoMappings(
          (node?.morphoMappings ?? []).map((mapping) => {
            if (!mapping.sectionId) return mapping;
            const page =
              mapping.target === "assets"
                ? "assets"
                : mapping.target === "liabilities"
                  ? "liabilities"
                  : "cash";
            const section = [...assetSections, ...liabilitySections, ...cashSections].find(
              (s) => s.id === mapping.sectionId && s.page === page
            );
            if (section && isWalletSyncSection(section)) return mapping;
            return { ...mapping, sectionId: undefined, rowId: undefined };
          }),
          assetSections,
          liabilitySections,
          cashSections
        )
      );
      return {
        label: node?.label ?? "",
        order: node?.order ?? siblingCount,
        status: node?.status ?? "active",
        notes: node?.notes ?? "",
      };
    },
    [node?.id, parentId, siblingCount]
  );

  const onSubmit = (values: FormValues) => {
    const validation = validateWalletAddressEntries(preparedEntries);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    const entries = validation.entries;

    const legacy = walletLegacyFieldsFromEntries(entries);
    let workingSections = [...sections];
    const ensureForTarget = (target: MorphoPositionTarget): string => {
      const { sections: nextSections, sectionId } = ensureWalletSyncSectionForTarget(
        workingSections,
        target
      );
      const added = nextSections.find(
        (section) => !workingSections.some((prev) => prev.id === section.id)
      );
      if (added) {
        upsertSection(added);
      }
      workingSections = nextSections;
      return sectionId;
    };

    const effectiveSyncEnabled = canSync && syncEnabled;

    if (effectiveSyncEnabled) {
      for (const mapping of morphoMappings.filter((m) => m.enabled)) {
        ensureForTarget(mapping.target);
      }
    }

    const workingAssetSections = workingSections.filter((s) => s.page === "assets");
    const workingLiabilitySections = workingSections.filter((s) => s.page === "liabilities");
    const workingCashSections = workingSections.filter((s) => s.page === "cash");

    const normalizedMappings = normalizeMorphoMappings(
      morphoMappings,
      workingAssetSections,
      workingLiabilitySections,
      workingCashSections
    ).map((mapping) => {
      if (!mapping.rowId) return mapping;
      const rowId = mapping.rowId;
      const sectionId = mapping.sectionId;
      if (!sectionId) return { ...mapping, rowId: undefined };
      const valid =
        mapping.target === "assets"
          ? assets.some((row) => row.id === rowId && row.sectionId === sectionId)
          : mapping.target === "liabilities"
            ? liabilities.some((row) => row.id === rowId && row.sectionId === sectionId)
            : cashAccounts.some((row) => row.id === rowId && row.sectionId === sectionId);
      return valid ? mapping : { ...mapping, rowId: undefined };
    });

    if (effectiveSyncEnabled) {
      if (!hasMorphoCapableAddress(entries)) {
        toast.error("Add an Ethereum/Base address with those chains selected before enabling sync.");
        return;
      }
      const activeMappings = normalizedMappings.filter((m) => m.enabled && m.sectionId);
      if (activeMappings.length === 0) {
        toast.error("Scan Morpho and map at least one position to a section.");
        return;
      }
      for (const mapping of activeMappings) {
        const page =
          mapping.target === "assets"
            ? "assets"
            : mapping.target === "liabilities"
              ? "liabilities"
              : "cash";
        const section = workingSections.find(
          (s) => s.id === mapping.sectionId && s.page === page
        );
        if (!section || !isWalletSyncSection(section)) {
          toast.error(
            `Morpho mapping "${mapping.label ?? mapping.key}" must target a crypto or DeFi section.`
          );
          return;
        }
      }
    }

    onSave({
      ...(node ?? {}),
      id: node?.id ?? createEntityId("wm"),
      parentId: node?.parentId ?? parentId,
      label: values.label.trim(),
      order: values.order,
      address: legacy.address,
      networks: legacy.networks,
      addresses: entries.length ? entries : undefined,
      morphoMappings: normalizedMappings.length ? normalizedMappings : undefined,
      syncEnabled: effectiveSyncEnabled || undefined,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      links: node?.links,
      walletType: node?.walletType,
      owner: node?.owner,
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
            Name the wallet, add addresses per chain, scan Morpho on Ethereum/Base, and choose where
            each position syncs in your portfolio.
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
                  placeholder="e.g. DeFi wallet"
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
                />
              </div>
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

            <WalletAddressEntriesEditor entries={addressEntries} onChange={setAddressEntries} />

            {canSync ? (
              <div className="space-y-3">
                <WalletMorphoMappingPanel
                  key={node?.id ?? "new-wallet"}
                  addressEntries={preparedEntries}
                  assetSections={assetSections}
                  liabilitySections={liabilitySections}
                  cashSections={cashSections}
                  assets={assets}
                  liabilities={liabilities}
                  cashAccounts={cashAccounts}
                  mappings={morphoMappings}
                  onChange={setMorphoMappings}
                />
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div>
                    <span className="text-sm font-medium">Enable wallet sync</span>
                    <p className="text-xs text-muted-foreground">
                      Mapped Morpho positions and Bitcoin balances update on sync.
                    </p>
                  </div>
                  <input
                    id="wallet-sync-enabled"
                    type="checkbox"
                    checked={canSync && syncEnabled}
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
