"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerBody,
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
import { roundMoney } from "@/lib/utils";
import {
  MAX_EDIT_DECIMALS,
  sanitizeAssetDecimalInput,
  sanitizeAssetPriceInput,
} from "@/lib/format-decimals";
import type { AssetPriceSource } from "@/types";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isCryptoAssetSection } from "@/lib/asset-sections";
import {
  ASSET_NETWORK_SELECT_OPTIONS,
  normalizeAssetNetwork,
} from "@/lib/asset-network";
import { isMetalsSection } from "@/lib/metals";
import type { Asset } from "@/types";

const assetSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  name: z.string().min(1, "Name is required"),
  sectionId: z.string().min(1),
  network: z.string().optional(),
  protocol: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(0),
  costBasis: z.number().min(0).optional(),
  priceSource: z.enum(["api", "manual"]),
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
      priceSource: "api" as AssetPriceSource,
    },
  });

  const sectionId = useWatch({ control, name: "sectionId" });
  const priceSource = useWatch({ control, name: "priceSource" });
  const network = useWatch({ control, name: "network" });
  const selectedSection = assetSections.find((s) => s.id === sectionId);
  const showPositionFields =
    (selectedSection != null && isCryptoAssetSection(selectedSection)) ||
    Boolean(asset?.network || asset?.protocol);
  const metalsSection = selectedSection != null && isMetalsSection(selectedSection);
  const cryptoSection = selectedSection != null && isCryptoAssetSection(selectedSection);

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
          network: normalizeAssetNetwork(asset.network) ?? "",
          protocol: asset.protocol ?? "",
          price: asset.price,
          quantity: asset.quantity,
          costBasis: asset.costBasis,
          priceSource: asset.priceSource ?? "api",
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
        priceSource: "api" as const,
      };
    },
    [asset?.id, defaultSectionId, assetSections.length]
  );

  const onSubmit = (values: AssetFormValues) => {
    const isCrypto =
      (selectedSection != null && isCryptoAssetSection(selectedSection)) ||
      Boolean(values.network?.trim() || values.protocol?.trim() || asset?.walletId);
    const saved: Asset = {
      id: asset?.id ?? createEntityId("asset"),
      symbol: values.symbol,
      name: values.name,
      sectionId: values.sectionId,
      price: sanitizeAssetPriceInput(values.price),
      quantity: sanitizeAssetDecimalInput(values.quantity, isCrypto),
      priceSource: values.priceSource,
      network: normalizeAssetNetwork(values.network),
      protocol: values.protocol?.trim() || undefined,
    };
    if (values.costBasis != null && Number.isFinite(values.costBasis)) {
      saved.costBasis = roundMoney(values.costBasis);
    }
    onSave(saved);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{asset?.id ? "Edit Asset" : "Add Asset"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
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
                Optional per position — chain and where it is held (protocol, wallet, or custodian).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <NativeSelect
                    id="network"
                    value={network ?? ""}
                    onValueChange={(v) => setValue("network", v)}
                    options={ASSET_NETWORK_SELECT_OPTIONS}
                    placeholder="Select network"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <Input id="protocol" {...register("protocol")} placeholder="e.g. Aave, Morpho, Coinbase" />
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Price source</p>
              <p className="text-xs text-muted-foreground">
                {metalsSection
                  ? "Metals refresh to USD per troy oz (Yahoo futures on the home server)."
                  : cryptoSection
                    ? "Crypto uses CoinGecko on the home server (Finnhub and Yahoo as backups)."
                    : "Stocks and ETFs use Finnhub on the home server with Yahoo as backup."}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={priceSource === "manual"}
                onChange={(e) =>
                  setValue("priceSource", e.target.checked ? "manual" : "api", {
                    shouldDirty: true,
                  })
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span>Manual price</span>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">{metalsSection ? "Price (USD / oz)" : "Price"}</Label>
              <Input
                id="price"
                type="number"
                step="any"
                disabled={priceSource === "api"}
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
              <p className="text-xs text-muted-foreground">
                {showPositionFields
                  ? `Up to ${MAX_EDIT_DECIMALS} decimals on save; table shows ${MAX_EDIT_DECIMALS}.`
                  : "Any precision on save; table shows up to 3 decimals."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costBasis">Cost basis (optional)</Label>
              <Input
                id="costBasis"
                type="number"
                step="0.01"
                placeholder="Optional"
                {...register("costBasis", {
                  setValueAs: (value) => {
                    if (value === "" || value == null) return undefined;
                    const parsed = Number(value);
                    return Number.isFinite(parsed) ? parsed : undefined;
                  },
                })}
              />
            </div>
          </div>
          </DrawerBody>
          <DrawerFooter>
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
