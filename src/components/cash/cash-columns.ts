export type CashColumnKey =
  | "name"
  | "balance"
  | "network"
  | "protocol"
  | "originalAmount"
  | "interest"
  | "address";

export const CASH_BASE_COLUMN_OPTIONS: { key: CashColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "balance", label: "Balance" },
  { key: "originalAmount", label: "Initial balance" },
  { key: "interest", label: "Interest accrued" },
  { key: "address", label: "Address" },
];

export const CASH_POSITION_COLUMN_OPTIONS: { key: CashColumnKey; label: string }[] = [
  { key: "network", label: "Network" },
  { key: "protocol", label: "Protocol" },
];

/** @deprecated Use getCashColumnOptions */
export const CASH_COLUMN_OPTIONS = [
  ...CASH_BASE_COLUMN_OPTIONS.slice(0, 2),
  ...CASH_POSITION_COLUMN_OPTIONS,
  ...CASH_BASE_COLUMN_OPTIONS.slice(2),
];

export function getCashColumnOptions(showPositionColumns: boolean) {
  if (!showPositionColumns) return CASH_BASE_COLUMN_OPTIONS;
  return [
    CASH_BASE_COLUMN_OPTIONS[0],
    CASH_BASE_COLUMN_OPTIONS[1],
    ...CASH_POSITION_COLUMN_OPTIONS,
    ...CASH_BASE_COLUMN_OPTIONS.slice(2),
  ];
}

/** Default table columns — initial balance & interest are opt-in via Filter. */
export const DEFAULT_CASH_COLUMNS: CashColumnKey[] = ["name", "balance"];

export const CASH_POSITION_COLUMNS = new Set<CashColumnKey>(["network", "protocol"]);
