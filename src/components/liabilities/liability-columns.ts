import type { ColumnOption } from "@/components/shared/ColumnPickerPopover";

export type LiabilityColumnKey =
  | "name"
  | "totalDebt"
  | "network"
  | "protocol"
  | "initialBalance"
  | "interestAccrued"
  | "apy"
  | "address"
  | "collateral"
  | "lltv"
  | "ltv"
  | "liquidationPrice";

export const LIABILITY_BASE_COLUMN_OPTIONS: ColumnOption<LiabilityColumnKey>[] = [
  { key: "name", label: "Name" },
  { key: "totalDebt", label: "Total debt" },
  { key: "initialBalance", label: "Initial balance" },
  { key: "interestAccrued", label: "Interest accrued" },
  { key: "apy", label: "APY %" },
  { key: "address", label: "Address" },
];

export const LIABILITY_POSITION_COLUMN_OPTIONS: ColumnOption<LiabilityColumnKey>[] = [
  { key: "network", label: "Network" },
  { key: "protocol", label: "Protocol" },
];

export const LIABILITY_DEFI_COLUMN_OPTIONS: ColumnOption<LiabilityColumnKey>[] = [
  { key: "collateral", label: "Collateral" },
  { key: "lltv", label: "LLTV %" },
  { key: "ltv", label: "LTV %" },
  { key: "liquidationPrice", label: "Liq. price" },
];

/** @deprecated Use getLiabilityColumnOptions */
export const LIABILITY_COLUMN_OPTIONS = [
  ...LIABILITY_BASE_COLUMN_OPTIONS,
  ...LIABILITY_POSITION_COLUMN_OPTIONS,
  ...LIABILITY_DEFI_COLUMN_OPTIONS,
];

export function getLiabilityColumnOptions(options: {
  showPositionColumns: boolean;
  showDefiColumns: boolean;
}): ColumnOption<LiabilityColumnKey>[] {
  const out = [...LIABILITY_BASE_COLUMN_OPTIONS];
  if (options.showPositionColumns) {
    out.push(...LIABILITY_POSITION_COLUMN_OPTIONS);
  }
  if (options.showDefiColumns) {
    out.push(...LIABILITY_DEFI_COLUMN_OPTIONS);
  }
  return out;
}

/** Default table columns — detail columns are opt-in via Filter. */
export const DEFAULT_LIABILITY_COLUMNS: LiabilityColumnKey[] = ["name", "totalDebt"];

export const LIABILITY_POSITION_COLUMNS = new Set<LiabilityColumnKey>(["network", "protocol"]);

export const LIABILITY_DEFI_COLUMNS = new Set<LiabilityColumnKey>([
  "collateral",
  "lltv",
  "ltv",
  "liquidationPrice",
]);
