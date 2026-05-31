"use client";

import { useState } from "react";
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
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { Liability, PortfolioSection } from "@/types";

const liabilitySchema = z.object({
  name: z.string().min(1),
  sectionId: z.string().min(1),
  balance: z.number().min(0),
  initialBalance: z.number().optional(),
  interestAccrued: z.number().optional(),
  apy: z.number().optional(),
  address: z.string().optional(),
  collateral: z.number().optional(),
  lltv: z.number().optional(),
  ltv: z.number().optional(),
  liquidationPrice: z.number().optional(),
});

type LiabilityFormValues = z.infer<typeof liabilitySchema>;

function optionalNumber(v: number | undefined): number | undefined {
  return v != null && !Number.isNaN(v) ? v : undefined;
}

interface LiabilityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liability?: Liability | null;
  defaultSectionId?: string;
  onSave: (liability: Liability) => void;
}

export function LiabilityDrawer({
  open,
  onOpenChange,
  liability,
  defaultSectionId,
  onSave,
}: LiabilityDrawerProps) {
  const { getSections } = usePortfolio();
  const sections = getSections("liabilities");

  const { register, control, handleSubmit, reset, setValue } = useForm<LiabilityFormValues>({
    resolver: zodResolver(liabilitySchema),
    defaultValues: { name: "", sectionId: "", balance: 0 },
  });

  const sectionId = useWatch({ control, name: "sectionId" });
  const section = sections.find((s) => s.id === sectionId);
  const isDefi = section?.metadata?.isDefi ?? false;

  const [showOptional, setShowOptional] = useState(
    () =>
      liability?.initialBalance != null ||
      liability?.interestAccrued != null ||
      liability?.apy != null
  );

  useDrawerFormReset(
    open,
    reset,
    () => {
      const fallbackSection = defaultSectionId ?? sections[0]?.id ?? "";
      if (liability) {
        setShowOptional(
          liability.initialBalance != null ||
            liability.interestAccrued != null ||
            liability.apy != null
        );
        return {
          name: liability.name,
          sectionId: liability.sectionId,
          balance: liability.balance,
          initialBalance: liability.initialBalance,
          interestAccrued: liability.interestAccrued,
          apy: liability.apy,
          address: liability.address ?? "",
          collateral: liability.collateral,
          lltv: liability.lltv,
          ltv: liability.ltv,
          liquidationPrice: liability.liquidationPrice,
        };
      }
      setShowOptional(false);
      return {
        name: "",
        sectionId: fallbackSection,
        balance: 0,
      };
    },
    [liability?.id, defaultSectionId, sections.length]
  );

  const onSubmit = (values: LiabilityFormValues) => {
    onSave({
      id: liability?.id ?? createEntityId("lia"),
      name: values.name,
      sectionId: values.sectionId,
      balance: values.balance,
      initialBalance: showOptional ? optionalNumber(values.initialBalance) : undefined,
      interestAccrued: showOptional ? optionalNumber(values.interestAccrued) : undefined,
      apy: showOptional ? optionalNumber(values.apy) : undefined,
      address: isDefi ? values.address || undefined : undefined,
      collateral: isDefi ? optionalNumber(values.collateral) : undefined,
      lltv: isDefi ? optionalNumber(values.lltv) : undefined,
      ltv: isDefi ? optionalNumber(values.ltv) : undefined,
      liquidationPrice: isDefi ? optionalNumber(values.liquidationPrice) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{liability ? "Edit Liability" : "Add Liability"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="liability-section">Section</Label>
            <NativeSelect
              id="liability-section"
              value={sectionId}
              onValueChange={(v) => setValue("sectionId", v)}
              options={sections.map((s: PortfolioSection) => ({
                value: s.id,
                label: s.label,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Total debt (current)</Label>
            <Input type="number" step="any" {...register("balance", { valueAsNumber: true })} />
          </div>

          {!isDefi && (
            <>
              {!showOptional ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowOptional(true)}
                >
                  + Add loan details (optional)
                </Button>
              ) : (
                <div className="space-y-3 rounded-lg border border-dashed border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    Optional — initial balance, interest, APY
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Initial balance</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        {...register("initialBalance", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interest accrued</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        {...register("interestAccrued", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>APY %</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        {...register("apy", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => {
                      setShowOptional(false);
                      setValue("initialBalance", undefined);
                      setValue("interestAccrued", undefined);
                      setValue("apy", undefined);
                    }}
                  >
                    Remove optional fields
                  </Button>
                </div>
              )}
            </>
          )}

          {isDefi && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">DeFi position</p>
              {!showOptional && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowOptional(true)}
                >
                  + Add loan details (optional)
                </Button>
              )}
              {showOptional && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Initial balance</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      {...register("initialBalance", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interest accrued</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      {...register("interestAccrued", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>APY %</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      {...register("apy", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register("address")} placeholder="Optional reference" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Collateral</Label>
                  <Input
                    type="number"
                    step="any"
                    {...register("collateral", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LLTV %</Label>
                  <Input type="number" step="any" {...register("lltv", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>LTV %</Label>
                  <Input type="number" step="any" {...register("ltv", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Liquidation price</Label>
                  <Input
                    type="number"
                    step="any"
                    {...register("liquidationPrice", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

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
