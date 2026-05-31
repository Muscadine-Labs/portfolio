"use client";

import { useState } from "react";
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
import { WalletNetworkToggles } from "@/components/plan/WalletNetworkToggles";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import {
  detectWalletNetworks,
  normalizeConnectedWalletAddress,
  normalizeWalletNetworks,
  validateWalletNetworks,
} from "@/lib/wallet-address";
import { WALLET_TYPE_OPTIONS } from "@/lib/wallet-types";
import type { WalletChain, WalletMapNode, WalletType } from "@/types";

const schema = z.object({
  label: z.string().min(1, "Name is required"),
  order: z.number().int().min(0, "Order must be 0 or greater"),
  walletType: z.string().optional(),
  address: z.string().optional(),
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

export function WalletMapDrawer({
  open,
  onOpenChange,
  node,
  parentId,
  parentLabel,
  siblingCount,
  onSave,
}: WalletMapDrawerProps) {
  const [networks, setNetworks] = useState<WalletChain[]>(["ethereum", "base"]);
  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      order: 0,
      status: "active",
      walletType: "",
      address: "",
    },
  });

  const status = useWatch({ control, name: "status" });
  const walletType = useWatch({ control, name: "walletType" });
  const address = useWatch({ control, name: "address" }) ?? "";

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
        order: node?.order ?? siblingCount,
        walletType: node?.walletType ?? "",
        address: initialAddress,
        status: node?.status ?? "active",
        notes: node?.notes ?? "",
      };
    },
    [node?.id, parentId, siblingCount]
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

    onSave({
      id: node?.id ?? createEntityId("wm"),
      parentId: node?.parentId ?? parentId,
      label: values.label.trim(),
      order: values.order,
      walletType: (values.walletType as WalletType) || undefined,
      address: trimmedAddress
        ? normalizeConnectedWalletAddress(trimmedAddress, normalizedNetworks ?? [])
        : undefined,
      networks: normalizedNetworks,
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
            Plan your wallet tree with labels, order, type, status, address, and networks.
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
