"use client";

import { useForm, useWatch } from "react-hook-form";
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
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import { WALLET_TYPE_OPTIONS } from "@/lib/wallet-types";
import type { WalletMapNode, WalletType } from "@/types";

const schema = z.object({
  label: z.string().min(1),
  owner: z.string().optional(),
  walletType: z.string().optional(),
  identifier: z.string().optional(),
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
  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", status: "active", walletType: "" },
  });

  const status = useWatch({ control, name: "status" });
  const walletType = useWatch({ control, name: "walletType" });

  useDrawerFormReset(
    open,
    reset,
    () => ({
      label: node?.label ?? "",
      owner: node?.owner ?? "",
      walletType: node?.walletType ?? "",
      identifier: node?.identifier ?? "",
      status: node?.status ?? "active",
      notes: node?.notes ?? "",
    }),
    [node?.id, parentId]
  );

  const onSubmit = (values: FormValues) => {
    onSave({
      id: node?.id ?? createEntityId("wm"),
      parentId: node?.parentId ?? parentId,
      label: values.label,
      order: node?.order ?? siblingCount,
      owner: values.owner || undefined,
      walletType: (values.walletType as WalletType) || undefined,
      identifier: values.identifier || undefined,
      status: values.status,
      notes: values.notes || undefined,
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
            Name, owner, wallet type, and status for this entry in your map.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-label">Name</Label>
            <Input id="wallet-label" {...register("label")} placeholder="e.g. Bitcoin Cold #1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wallet-owner">Owner</Label>
              <Input id="wallet-owner" {...register("owner")} placeholder="e.g. Nick" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet-type">Type</Label>
              <NativeSelect
                id="wallet-type"
                value={walletType}
                onValueChange={(v) => setValue("walletType", v)}
                options={WALLET_TYPE_OPTIONS}
                placeholder="Choose type"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet-identifier">ENS / address</Label>
            <Input
              id="wallet-identifier"
              {...register("identifier")}
              placeholder="e.g. nick.base.eth"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet-status">Status</Label>
            <NativeSelect
              id="wallet-status"
              value={status}
              onValueChange={(v) => setValue("status", v as FormValues["status"])}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet-notes">Notes</Label>
            <Input id="wallet-notes" {...register("notes")} />
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
