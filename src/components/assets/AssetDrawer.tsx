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
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isWalletAssetSection } from "@/lib/asset-sections";
import type { Asset } from "@/types";

const assetSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  name: z.string().min(1, "Name is required"),
  sectionId: z.string().min(1),
  network: z.string().optional(),
  protocol: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(0),
  costBasis: z.number().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  defaultSectionId?: string;
  onSave: (asset: Asset) => void;
}

export function AssetDrawer({
  open,
  onOpenChange,
  asset,
  defaultSectionId,
  onSave,
}: AssetDrawerProps) {
  const { getSections } = usePortfolio();
  const assetSections = getSections("assets");

  const { register, control, handleSubmit, reset, setValue } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      symbol: "",
      name: "",
      sectionId: "",
      network: "",
      protocol: "",
      price: 0,
      quantity: 0,
      costBasis: undefined,
    },
  });

  const sectionId = useWatch({ control, name: "sectionId" });
  const selectedSection = assetSections.find((s) => s.id === sectionId);
  const showPositionFields = selectedSection
    ? isWalletAssetSection(selectedSection)
    : false;

  useDrawerFormReset(
    open,
    reset,
    () => {
      const fallbackSection = defaultSectionId ?? assetSections[0]?.id ?? "";
      if (asset) {
        return {
          symbol: asset.symbol,
          name: asset.name,
          sectionId: asset.sectionId,
          network: asset.network ?? "",
          protocol: asset.protocol ?? "",
          price: asset.price,
          quantity: asset.quantity,
          costBasis: asset.costBasis,
        };
      }
      return {
        symbol: "",
        name: "",
        sectionId: fallbackSection,
        network: "",
        protocol: "",
        price: 0,
        quantity: 0,
        costBasis: undefined,
      };
    },
    [asset?.id, defaultSectionId, assetSections.length]
  );

  const onSubmit = (values: AssetFormValues) => {
    onSave({
      id: asset?.id ?? createEntityId("asset"),
      symbol: values.symbol,
      name: values.name,
      sectionId: values.sectionId,
      price: values.price,
      quantity: values.quantity,
      costBasis: values.costBasis,
      network: values.network || undefined,
      protocol: values.protocol || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{asset?.id ? "Edit Asset" : "Add Asset"}</DrawerTitle>
        </DrawerHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 overflow-y-auto px-4 pb-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" {...register("symbol")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-section">Section</Label>
            <NativeSelect
              id="asset-section"
              value={sectionId}
              onValueChange={(v) => setValue("sectionId", v)}
              options={assetSections.map((s) => ({ value: s.id, label: s.label }))}
              placeholder="Select section"
            />
          </div>
          {showPositionFields ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Network and protocol apply to this position only — one wallet section can hold
                assets on Base, Ethereum, and other chains.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <Input id="network" {...register("network")} placeholder="e.g. Base, Ethereum" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <Input id="protocol" {...register("protocol")} placeholder="e.g. Morpho" />
                </div>
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="any"
                {...register("price", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                {...register("quantity", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costBasis">Cost Basis</Label>
              <Input
                id="costBasis"
                type="number"
                step="any"
                {...register("costBasis", { valueAsNumber: true })}
              />
            </div>
          </div>
          <DrawerFooter className="px-0">
            <Button type="submit">{asset?.id ? "Save Changes" : "Add Asset"}</Button>
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
