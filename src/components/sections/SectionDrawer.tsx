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
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createSectionId } from "@/lib/sections";
import { isSectionGroupPage } from "@/lib/section-groups";
import type { PageType, PortfolioSection, SectionGroupPage } from "@/types";

const NEW_GROUP_VALUE = "__new__";
const NO_GROUP_VALUE = "";

const sectionSchema = z.object({
  label: z.string().min(1, "Section name is required"),
  account: z.string().optional(),
  groupSelection: z.string().optional(),
  newGroupName: z.string().optional(),
  isDefi: z.boolean().optional(),
  isCrypto: z.boolean().optional(),
  showNetworkColumn: z.boolean().optional(),
  showProtocolColumn: z.boolean().optional(),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

interface SectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: PortfolioSection | null;
  page: PageType;
  defaultGroupId?: string;
  onSave: (section: PortfolioSection) => void;
  showDefiToggle?: boolean;
  showCryptoToggle?: boolean;
}

export function SectionDrawer({
  open,
  onOpenChange,
  section,
  page,
  defaultGroupId,
  onSave,
  showDefiToggle = false,
  showCryptoToggle = false,
}: SectionDrawerProps) {
  const { getSectionGroups, addSectionGroup } = usePortfolio();
  const supportsGroups = isSectionGroupPage(page);
  const pageGroups = supportsGroups ? getSectionGroups(page as SectionGroupPage) : [];

  const { register, handleSubmit, reset, setValue, control } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      label: "",
      account: "",
      groupSelection: NO_GROUP_VALUE,
      newGroupName: "",
      isDefi: false,
      isCrypto: false,
      showNetworkColumn: true,
      showProtocolColumn: true,
    },
  });

  const groupSelection = useWatch({ control, name: "groupSelection" });
  const isCrypto = useWatch({ control, name: "isCrypto" });
  const isDefi = useWatch({ control, name: "isDefi" });
  const positionColumnsEnabled = Boolean(isCrypto || isDefi);

  useDrawerFormReset(
    open,
    reset,
    () => {
      if (section) {
        return {
          label: section.label,
          account: section.metadata?.account ?? "",
          groupSelection: section.groupId ?? NO_GROUP_VALUE,
          newGroupName: "",
          isDefi: section.metadata?.isDefi ?? false,
          isCrypto: section.metadata?.isCrypto ?? false,
          showNetworkColumn: section.metadata?.showNetworkColumn !== false,
          showProtocolColumn: section.metadata?.showProtocolColumn !== false,
        };
      }
      return {
        label: "",
        account: "",
        groupSelection: defaultGroupId ?? NO_GROUP_VALUE,
        newGroupName: "",
        isDefi: false,
        isCrypto: false,
        showNetworkColumn: true,
        showProtocolColumn: true,
      };
    },
    [section?.id, defaultGroupId]
  );

  const onSubmit = (values: SectionFormValues) => {
    const metadata: PortfolioSection["metadata"] = { ...section?.metadata };
    if (showDefiToggle) metadata.isDefi = values.isDefi;
    if (showCryptoToggle) metadata.isCrypto = values.isCrypto;
    if (values.isCrypto || values.isDefi) {
      metadata.showNetworkColumn = values.showNetworkColumn !== false;
      metadata.showProtocolColumn = values.showProtocolColumn !== false;
    } else {
      delete metadata.showNetworkColumn;
      delete metadata.showProtocolColumn;
    }
    const account = values.account?.trim();
    if (account) metadata.account = account;
    else delete metadata.account;
    delete metadata.walletId;

    let groupId: string | undefined;
    if (supportsGroups) {
      if (values.groupSelection === NEW_GROUP_VALUE) {
        const newName = values.newGroupName?.trim();
        if (newName) {
          groupId = addSectionGroup(page as SectionGroupPage, newName).id;
        }
      } else if (values.groupSelection) {
        groupId = values.groupSelection;
      }
    }

    const hasMeta =
      metadata.isDefi === true ||
      metadata.isCrypto === true ||
      metadata.showNetworkColumn === false ||
      metadata.showProtocolColumn === false ||
      (metadata.account != null && metadata.account !== "");

    onSave({
      id: section?.id ?? createSectionId(page),
      page,
      label: values.label.trim(),
      order: section?.order ?? 999,
      groupId,
      metadata: hasMeta ? metadata : undefined,
    });
    onOpenChange(false);
  };

  const groupOptions = [
    { value: NO_GROUP_VALUE, label: "No group" },
    ...pageGroups.map((group) => ({ value: group.id, label: group.name })),
    { value: NEW_GROUP_VALUE, label: "Create new group…" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{section ? "Edit Section" : "Add Section"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
          {supportsGroups ? (
            <div className="space-y-2">
              <Label htmlFor="section-group">Group</Label>
              <NativeSelect
                id="section-group"
                value={groupSelection ?? NO_GROUP_VALUE}
                onValueChange={(v) => setValue("groupSelection", v)}
                options={groupOptions}
              />
              {groupSelection === NEW_GROUP_VALUE ? (
                <Input
                  {...register("newGroupName")}
                  placeholder="New group name, e.g. Retirement"
                />
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="section-label">Section name</Label>
            <Input id="section-label" {...register("label")} placeholder="e.g. ROTH, Checking" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-account">Account / provider</Label>
            <Input
              id="section-account"
              {...register("account")}
              placeholder="Optional — e.g. Fidelity, Coinbase"
            />
          </div>
          {showCryptoToggle ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-border"
                {...register("isCrypto")}
              />
              Crypto section (show network &amp; protocol columns on assets)
            </label>
          ) : null}
          {showDefiToggle ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-border"
                {...register("isDefi")}
              />
              DeFi section (collateral / LTV columns on liabilities)
            </label>
          ) : null}
          {positionColumnsEnabled ? (
            <div className="ml-6 space-y-2 border-l border-border/60 pl-3">
              <p className="text-xs text-muted-foreground">Position columns for this section</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  {...register("showNetworkColumn")}
                />
                Show network column
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  {...register("showProtocolColumn")}
                />
                Show protocol column
              </label>
            </div>
          ) : null}
          </DrawerBody>
          <DrawerFooter>
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
