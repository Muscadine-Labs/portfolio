export type LiabilityColumnKey =
  | "name"
  | "totalDebt"
  | "initialBalance"
  | "interestAccrued"
  | "apy"
  | "address"
  | "collateral"
  | "lltv"
  | "ltv"
  | "liquidationPrice";

export const LIABILITY_COLUMN_OPTIONS: { key: LiabilityColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "totalDebt", label: "Total debt" },
  { key: "initialBalance", label: "Initial balance" },
  { key: "interestAccrued", label: "Interest accrued" },
  { key: "apy", label: "APY %" },
  { key: "address", label: "Address" },
  { key: "collateral", label: "Collateral" },
  { key: "lltv", label: "LLTV %" },
  { key: "ltv", label: "LTV %" },
  { key: "liquidationPrice", label: "Liq. price" },
];

/** Default table columns — loan detail columns are opt-in via Filter. */
export const DEFAULT_LIABILITY_COLUMNS: LiabilityColumnKey[] = ["name", "totalDebt"];
