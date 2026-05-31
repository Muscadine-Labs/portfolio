import { type ColumnOption } from "@/components/shared/ColumnPickerPopover";

export type AssetColumnKey =
  | "symbol"
  | "name"
  | "price"
  | "qty"
  | "network"
  | "protocol"
  | "costBasis"
  | "avgCost"
  | "marketValue"
  | "gainDollars"
  | "gainPercent"
  | "pctOfAssets"
  | "pctOfClass";

export const ASSET_COLUMN_OPTIONS: ColumnOption<AssetColumnKey>[] = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Name" },
  { key: "price", label: "Price" },
  { key: "qty", label: "Qty" },
  { key: "costBasis", label: "Cost Basis" },
  { key: "avgCost", label: "Avg Cost / Share" },
  { key: "marketValue", label: "Market Value" },
  { key: "gainDollars", label: "Gain $" },
  { key: "gainPercent", label: "Gain %" },
  { key: "pctOfAssets", label: "% of Assets" },
  { key: "pctOfClass", label: "% of Class" },
];

export const WALLET_POSITION_COLUMN_OPTIONS: ColumnOption<AssetColumnKey>[] = [
  { key: "network", label: "Network" },
  { key: "protocol", label: "Exchange" },
];

/** @deprecated Use WALLET_POSITION_COLUMN_OPTIONS */
export const DEFI_ASSET_COLUMN_OPTIONS = WALLET_POSITION_COLUMN_OPTIONS;

export function getAssetColumnOptions(showWalletPositionColumns: boolean) {
  return showWalletPositionColumns
    ? [...ASSET_COLUMN_OPTIONS, ...WALLET_POSITION_COLUMN_OPTIONS]
    : ASSET_COLUMN_OPTIONS;
}
