"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createSectionId } from "@/lib/sections";
import type { PageType, PortfolioSection } from "@/types";

const sectionSchema = z.object({
  label: z.string().min(1, "Section name is required"),
  isDefi: z.boolean().optional(),
  walletId: z.string().optional(),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

interface SectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: PortfolioSection | null;
  page: PageType;
  onSave: (section: PortfolioSection) => void;
  showDefiToggle?: boolean;
  /** Assets, cash, or liabilities — allow linking a connected wallet */
  linkWallet?: boolean;
}

export function SectionDrawer({
  open,
  onOpenChange,
  section,
  page,
  onSave,
  showDefiToggle = false,
  linkWallet = false,
}: SectionDrawerProps) {
  const { connectedWallets } = usePortfolio();
  const { register, handleSubmit, reset, setValue, control } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { label: "", isDefi: false, walletId: "" },
  });

  const walletId = useWatch({ control, name: "walletId" });

  useDrawerFormReset(
    open,
    reset,
    () => {
      if (section) {
        return {
          label: section.label,
          isDefi: section.metadata?.isDefi ?? false,
          walletId: section.metadata?.walletId ?? "",
        };
      }
      return { label: "", isDefi: false, walletId: "" };
    },
    [section?.id]
  );

  const onSubmit = (values: SectionFormValues) => {
    const metadata: PortfolioSection["metadata"] = { ...section?.metadata };
    if (showDefiToggle) metadata.isDefi = values.isDefi;
    if (linkWallet) {
      if (values.walletId) metadata.walletId = values.walletId;
      else delete metadata.walletId;
    }
    const hasMeta =
      metadata.isDefi === true || (metadata.walletId != null && metadata.walletId !== "");
    onSave({
      id: section?.id ?? createSectionId(page),
      page,
      label: values.label,
      order: section?.order ?? 999,
      metadata: hasMeta ? metadata : undefined,
    });
    onOpenChange(false);
  };

  const walletOptions = [
    { value: "", label: "No linked wallet" },
    ...connectedWallets.map((w) => ({
      value: w.id,
      label: `${w.label} (${w.address.slice(0, 6)}…${w.address.slice(-4)})`,
    })),
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{section ? "Edit Section" : "Add Section"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="section-label">Section Name</Label>
            <Input id="section-label" {...register("label")} placeholder="e.g. Brokerage" />
          </div>
          {linkWallet && connectedWallets.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="section-wallet">Connected wallet</Label>
              <NativeSelect
                id="section-wallet"
                value={walletId ?? ""}
                onValueChange={(v) => setValue("walletId", v)}
                options={walletOptions}
              />
              <p className="text-xs text-muted-foreground">
                Link this section to a wallet from Settings. Use Morpho sync to pull vaults and
                markets into the linked sections.
              </p>
            </div>
          ) : null}
          {showDefiToggle && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-border"
                {...register("isDefi")}
              />
              DeFi section (show collateral / LTV columns)
            </label>
          )}
          <DrawerFooter className="px-0">
            <Button type="submit">{section ? "Save" : "Create Section"}</Button>
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
