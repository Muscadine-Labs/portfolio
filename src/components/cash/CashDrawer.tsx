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
import { roundMoney } from "@/lib/utils";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { CashAccount } from "@/types";

const cashSchema = z.object({
  name: z.string().min(1),
  sectionId: z.string().min(1),
  balance: z.number().min(0),
  protocol: z.string().optional(),
  address: z.string().optional(),
  originalAmount: z.number().optional(),
  interest: z.number().optional(),
});

type CashFormValues = z.infer<typeof cashSchema>;

interface CashDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: CashAccount | null;
  defaultSectionId?: string;
  onSave: (account: CashAccount) => void;
}

export function CashDrawer({
  open,
  onOpenChange,
  account,
  defaultSectionId,
  onSave,
}: CashDrawerProps) {
  const { getSections } = usePortfolio();
  const cashSections = getSections("cash");

  const { register, control, handleSubmit, reset, setValue } = useForm<CashFormValues>({
    resolver: zodResolver(cashSchema),
    defaultValues: { name: "", sectionId: "", balance: 0 },
  });

  const sectionId = useWatch({ control, name: "sectionId" });
  const [showOptional, setShowOptional] = useState(
    () => account?.originalAmount != null || account?.interest != null
  );
  const section = cashSections.find((s) => s.id === sectionId);
  const isDefi = section?.metadata?.isDefi === true || section?.metadata?.isCrypto === true;

  useDrawerFormReset(
    open,
    reset,
    () => {
      const fallbackSection = defaultSectionId ?? cashSections[0]?.id ?? "";
      if (account) {
        setShowOptional(
          account.originalAmount != null || account.interest != null
        );
        return {
          name: account.name,
          sectionId: account.sectionId,
          balance: account.balance,
          protocol: account.protocol ?? "",
          address: account.address ?? "",
          originalAmount: account.originalAmount,
          interest: account.interest,
        };
      }
      setShowOptional(false);
      return {
        name: "",
        sectionId: fallbackSection,
        balance: 0,
        protocol: "",
        address: "",
      };
    },
    [account?.id, defaultSectionId, cashSections.length]
  );

  const optionalNumber = (v: number | undefined) =>
    v != null && !Number.isNaN(v) ? v : undefined;

  const onSubmit = (values: CashFormValues) => {
    onSave({
      id: account?.id ?? createEntityId("cash"),
      name: values.name,
      sectionId: values.sectionId,
      balance: roundMoney(values.balance),
      protocol: values.protocol || undefined,
      address: values.address || undefined,
      originalAmount: showOptional
        ? optionalNumber(
            values.originalAmount != null ? roundMoney(values.originalAmount) : undefined
          )
        : undefined,
      interest: showOptional
        ? optionalNumber(values.interest != null ? roundMoney(values.interest) : undefined)
        : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{account ? "Edit Account" : "Add Account"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input id="name" {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-section">Section</Label>
            <NativeSelect
              id="cash-section"
              value={sectionId}
              onValueChange={(v) => setValue("sectionId", v)}
              options={cashSections.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="any"
              {...register("balance", { valueAsNumber: true })}
            />
          </div>
          {(isDefi || account?.protocol) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol</Label>
                <Input id="protocol" {...register("protocol")} />
              </div>
            </>
          )}
          {!showOptional ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowOptional(true)}
            >
              + Add initial balance & interest (optional)
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-dashed border-border/50 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Optional — for savings / interest-bearing accounts</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">Initial balance</Label>
                  <Input
                    id="originalAmount"
                    type="number"
                    step="any"
                    placeholder="Optional"
                    {...register("originalAmount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest">Interest accrued</Label>
                  <Input
                    id="interest"
                    type="number"
                    step="any"
                    placeholder="Optional"
                    {...register("interest", { valueAsNumber: true })}
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
                  setValue("originalAmount", undefined);
                  setValue("interest", undefined);
                }}
              >
                Remove optional fields
              </Button>
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
