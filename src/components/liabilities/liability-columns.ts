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

/** Always visible — not in Filter picker. */
export const LIABILITY_CORE_COLUMNS = new Set<LiabilityColumnKey>(["name", "totalDebt"]);

/** Always on for DeFi sections — Morpho loan metrics. */
export const LIABILITY_DEFI_COLUMNS = new Set<LiabilityColumnKey>([
  "collateral",
  "lltv",
  "ltv",
  "liquidationPrice",
]);

/** Always on for crypto/DeFi sections when section toggles allow. */
export const LIABILITY_POSITION_COLUMNS = new Set<LiabilityColumnKey>(["network", "protocol"]);

/** Opt-in via Filter (non-DeFi sections, or extra detail on DeFi). */
export const LIABILITY_OPTIONAL_COLUMNS = new Set<LiabilityColumnKey>([
  "initialBalance",
  "interestAccrued",
  "apy",
  "address",
]);

export const LIABILITY_FILTER_COLUMN_OPTIONS: ColumnOption<LiabilityColumnKey>[] = [
  { key: "initialBalance", label: "Initial balance" },
  { key: "interestAccrued", label: "Interest accrued" },
  { key: "apy", label: "APY %" },
  { key: "address", label: "Address" },
];

/** Default table columns — DeFi Morpho columns appear automatically on DeFi sections. */
export const DEFAULT_LIABILITY_COLUMNS: LiabilityColumnKey[] = ["name", "totalDebt"];

export const LIABILITY_DEFI_COLUMN_OPTIONS = [...LIABILITY_DEFI_COLUMNS].map((key) => ({
  key,
  label:
    key === "collateral"
      ? "Collateral"
      : key === "lltv"
        ? "LLTV %"
        : key === "ltv"
          ? "LTV %"
          : "Liq. price",
}));

/** @deprecated Use LIABILITY_FILTER_COLUMN_OPTIONS */
export const LIABILITY_COLUMN_OPTIONS = LIABILITY_FILTER_COLUMN_OPTIONS;

export function getLiabilityFilterColumnOptions(): ColumnOption<LiabilityColumnKey>[] {
  return LIABILITY_FILTER_COLUMN_OPTIONS;
}
