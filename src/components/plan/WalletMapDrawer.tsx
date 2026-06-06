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
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import {
  emptyWalletAddressEntry,
  validateWalletAddressEntries,
  walletLegacyFieldsFromEntries,
} from "@/lib/wallet-entries";
import { isWalletSyncSection } from "@/lib/wallet-sync-sections";
import { normalizeMorphoMappings } from "@/lib/morpho-mapping-utils";
import type { MorphoPositionMapping, WalletAddressEntry, WalletMapNode } from "@/types";

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

function initialEvmAddress(node?: WalletMapNode | null): string {
  if (node?.addresses?.length) {
    const evm = node.addresses.find((entry) =>
      entry.networks.some((n) => n === "ethereum" || n === "base")
    );
    return (evm ?? node.addresses[0]).address;
  }
  return node?.address ?? node?.identifier ?? "";
}

function addressEntryFromInput(address: string): ReturnType<typeof emptyWalletAddressEntry> {
  return {
    ...emptyWalletAddressEntry(["ethereum", "base"]),
    address: address.trim(),
    networks: ["ethereum", "base"],
  };
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
  const liabilitySections = getSections("liabilities");
  const cashSections = getSections("cash");

  const [evmAddress, setEvmAddress] = useState("");
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

  const addressEntries = useMemo(
    () => (evmAddress.trim() ? [addressEntryFromInput(evmAddress)] : []),
    [evmAddress]
  );

  const canSync = status === "active" && /^0x[a-fA-F0-9]{40}$/.test(evmAddress.trim());

  useDrawerFormReset(
    open,
    reset,
    () => {
      setEvmAddress(initialEvmAddress(node));
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
    const trimmed = evmAddress.trim();
    let entries: WalletAddressEntry[] = [];

    if (trimmed) {
      const validation = validateWalletAddressEntries([addressEntryFromInput(trimmed)]);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }
      entries = validation.entries;
    }

    const legacy = walletLegacyFieldsFromEntries(entries);
    const normalizedMappings = normalizeMorphoMappings(
      morphoMappings,
      assetSections,
      liabilitySections,
      cashSections
    );

    if (syncEnabled) {
      if (!trimmed) {
        toast.error("Add an Ethereum address before enabling sync.");
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
        const section = [...assetSections, ...liabilitySections, ...cashSections].find(
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
      id: node?.id ?? createEntityId("wm"),
      parentId: node?.parentId ?? parentId,
      label: values.label.trim(),
      order: values.order,
      address: legacy.address,
      networks: legacy.networks,
      addresses: entries.length ? entries : undefined,
      morphoMappings: normalizedMappings.length ? normalizedMappings : undefined,
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
            Name the wallet, add an Ethereum/Base address, scan Morpho positions, and choose where
            each syncs in your portfolio.
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

            <div className="space-y-2">
              <Label htmlFor="wallet-evm-address">Ethereum / Base address</Label>
              <Input
                id="wallet-evm-address"
                value={evmAddress}
                onChange={(event) => setEvmAddress(event.target.value)}
                placeholder="0x…"
                className="font-mono text-sm"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Morpho positions are scanned on Ethereum and Base for this address.
              </p>
            </div>

            {canSync ? (
              <div className="space-y-3">
                <WalletMorphoMappingPanel
                  addressEntries={addressEntries}
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
                    <span className="text-sm font-medium">Enable Morpho sync</span>
                    <p className="text-xs text-muted-foreground">
                      Mapped positions update on sync from the wallet list.
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
