"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
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
import { WalletNetworkToggles } from "@/components/plan/WalletNetworkToggles";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import {
  detectWalletNetworks,
  normalizeConnectedWalletAddress,
  normalizeWalletNetworks,
  validateWalletNetworks,
} from "@/lib/wallet-address";
import { WALLET_TYPE_OPTIONS } from "@/lib/wallet-types";
import type { PageType, WalletChain, WalletMapNode, WalletType } from "@/types";

const schema = z.object({
  label: z.string().min(1, "Name is required"),
  walletType: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "planned"]),
  notes: z.string().optional(),
  assetsSectionId: z.string().optional(),
  cashSectionId: z.string().optional(),
  liabilitiesSectionId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "planned", label: "Not created yet" },
] as const;

function sectionOptionsForPage(
  sections: ReturnType<typeof usePortfolio>["sections"],
  page: PageType
) {
  return sections
    .filter((section) => section.page === page)
    .sort((a, b) => a.order - b.order)
    .map((section) => ({ value: section.id, label: section.label }));
}

interface WalletMapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: WalletMapNode | null;
  parentId: string | null;
  parentLabel?: string;
  siblingCount: number;
  onSave: (node: WalletMapNode) => void;
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
  const { sections } = usePortfolio();
  const [networks, setNetworks] = useState<WalletChain[]>(["ethereum", "base"]);
  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      status: "active",
      walletType: "",
      address: "",
      assetsSectionId: "",
      cashSectionId: "",
      liabilitiesSectionId: "",
    },
  });

  const status = useWatch({ control, name: "status" });
  const walletType = useWatch({ control, name: "walletType" });
  const address = useWatch({ control, name: "address" }) ?? "";
  const assetsSectionId = useWatch({ control, name: "assetsSectionId" }) ?? "";
  const cashSectionId = useWatch({ control, name: "cashSectionId" }) ?? "";
  const liabilitiesSectionId = useWatch({ control, name: "liabilitiesSectionId" }) ?? "";

  useDrawerFormReset(
    open,
    reset,
    () => {
      const initialAddress = node?.address ?? node?.identifier ?? "";
      const initialNetworks: WalletChain[] =
        node?.networks?.length && node.networks.length > 0
          ? node.networks
          : initialAddress
            ? detectWalletNetworks(initialAddress)
            : ["ethereum", "base"];
      setNetworks(initialNetworks);
      return {
        label: node?.label ?? "",
        walletType: node?.walletType ?? "",
        address: initialAddress,
        status: node?.status ?? "active",
        notes: node?.notes ?? "",
        assetsSectionId: node?.links?.assetsSectionId ?? "",
        cashSectionId: node?.links?.cashSectionId ?? "",
        liabilitiesSectionId: node?.links?.liabilitiesSectionId ?? "",
      };
    },
    [node?.id, parentId]
  );

  const assetSectionOptions = useMemo(
    () => sectionOptionsForPage(sections, "assets"),
    [sections]
  );
  const cashSectionOptions = useMemo(
    () => sectionOptionsForPage(sections, "cash"),
    [sections]
  );
  const liabilitySectionOptions = useMemo(
    () => sectionOptionsForPage(sections, "liabilities"),
    [sections]
  );

  const handleAddressChange = (value: string) => {
    setValue("address", value);
    const trimmed = value.trim();
    if (trimmed) {
      setNetworks(detectWalletNetworks(trimmed));
    }
  };

  const onSubmit = (values: FormValues) => {
    const trimmedAddress = values.address?.trim() ?? "";
    const normalizedNetworks =
      networks.length > 0 ? normalizeWalletNetworks(networks) : undefined;

    if (trimmedAddress && normalizedNetworks?.length) {
      const validation = validateWalletNetworks(trimmedAddress, normalizedNetworks);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }
    }

    const links = {
      assetsSectionId: values.assetsSectionId || undefined,
      cashSectionId: values.cashSectionId || undefined,
      liabilitiesSectionId: values.liabilitiesSectionId || undefined,
    };

    onSave({
      id: node?.id ?? createEntityId("wm"),
      parentId: node?.parentId ?? parentId,
      label: values.label.trim(),
      order: node?.order ?? siblingCount,
      walletType: (values.walletType as WalletType) || undefined,
      address: trimmedAddress
        ? normalizeConnectedWalletAddress(trimmedAddress, normalizedNetworks ?? [])
        : undefined,
      networks: normalizedNetworks,
      links:
        links.assetsSectionId || links.cashSectionId || links.liabilitiesSectionId
          ? links
          : undefined,
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
            Plan your wallet tree and, when active, link an on-chain address and portfolio sections.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
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
          <div className="space-y-2">
            <Label htmlFor="wallet-address">Address (optional)</Label>
            <Input
              id="wallet-address"
              value={address}
              onChange={(event) => handleAddressChange(event.target.value)}
              placeholder="0x…, bc1…, or Solana address"
              className="font-mono text-sm"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label>Networks</Label>
            <WalletNetworkToggles
              idPrefix={`wallet-drawer-${node?.id ?? "new"}`}
              address={address}
              selected={networks}
              onChange={setNetworks}
            />
            <p className="text-xs text-muted-foreground">
              Select every chain this wallet uses. With an address, only compatible chains can be
              selected.
            </p>
          </div>
          {address.trim() && status === "active" ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Assets section</Label>
                <NativeSelect
                  value={assetsSectionId}
                  onValueChange={(value) => setValue("assetsSectionId", value)}
                  options={[{ value: "", label: "—" }, ...assetSectionOptions]}
                  placeholder="Select…"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cash section</Label>
                <NativeSelect
                  value={cashSectionId}
                  onValueChange={(value) => setValue("cashSectionId", value)}
                  options={[{ value: "", label: "—" }, ...cashSectionOptions]}
                  placeholder="Select…"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Liabilities section</Label>
                <NativeSelect
                  value={liabilitiesSectionId}
                  onValueChange={(value) => setValue("liabilitiesSectionId", value)}
                  options={[{ value: "", label: "—" }, ...liabilitySectionOptions]}
                  placeholder="Select…"
                />
              </div>
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
          <DrawerFooter className="px-0">
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
