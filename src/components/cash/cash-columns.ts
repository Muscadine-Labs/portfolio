export type CashColumnKey =
  | "name"
  | "balance"
  | "originalAmount"
  | "interest"
  | "protocol"
  | "address";

export const CASH_COLUMN_OPTIONS: { key: CashColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "balance", label: "Balance" },
  { key: "originalAmount", label: "Initial balance" },
  { key: "interest", label: "Interest accrued" },
  { key: "protocol", label: "Protocol" },
  { key: "address", label: "Address" },
];

/** Default table columns — initial balance & interest are opt-in via Filter. */
export const DEFAULT_CASH_COLUMNS: CashColumnKey[] = ["name", "balance"];
