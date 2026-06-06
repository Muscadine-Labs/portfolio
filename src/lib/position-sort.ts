import type { Asset, CashAccount, Liability, PortfolioSection } from "@/types";
import { isCryptoAssetSection } from "@/lib/asset-sections";
import { getMarketValue } from "@/lib/utils";

/** Symbols ending with ** sort after normal alphabetical order. */
export function isDeferredSymbol(label: string): boolean {
  return label.trim().includes("**");
}

export function compareAlphabeticalDeferred(a: string, b: string): number {
  const aDefer = isDeferredSymbol(a);
  const bDefer = isDeferredSymbol(b);
  if (aDefer && !bDefer) return 1;
  if (!aDefer && bDefer) return -1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function normalizeSortKey(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Empty keys sort after populated keys. */
function compareSortKey(a: string, b: string): number {
  const aEmpty = !a;
  const bEmpty = !b;
  if (aEmpty && !bEmpty) return 1;
  if (!aEmpty && bEmpty) return -1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export interface CryptoSortableRow {
  network?: string;
  protocol?: string;
  value: number;
  label: string;
}

/** Crypto sections: network → protocol/exchange → market value (desc). */
export function compareCryptoByNetworkProtocolValue(
  a: CryptoSortableRow,
  b: CryptoSortableRow
): number {
  const byNetwork = compareSortKey(
    normalizeSortKey(a.network),
    normalizeSortKey(b.network)
  );
  if (byNetwork !== 0) return byNetwork;

  const byProtocol = compareSortKey(
    normalizeSortKey(a.protocol),
    normalizeSortKey(b.protocol)
  );
  if (byProtocol !== 0) return byProtocol;

  if (b.value !== a.value) return b.value - a.value;

  return compareAlphabeticalDeferred(a.label, b.label);
}

export function sortAssetsInSection(section: PortfolioSection, assets: Asset[]): Asset[] {
  if (!isCryptoAssetSection(section)) {
    return [...assets].sort((a, b) => compareAlphabeticalDeferred(a.symbol, b.symbol));
  }
  return [...assets].sort((a, b) =>
    compareCryptoByNetworkProtocolValue(
      {
        network: a.network,
        protocol: a.protocol,
        value: getMarketValue(a),
        label: a.symbol,
      },
      {
        network: b.network,
        protocol: b.protocol,
        value: getMarketValue(b),
        label: b.symbol,
      }
    )
  );
}

export function sortLiabilitiesInSection(
  section: PortfolioSection,
  liabilities: Liability[]
): Liability[] {
  if (!isCryptoAssetSection(section)) {
    return [...liabilities].sort((a, b) => compareAlphabeticalDeferred(a.name, b.name));
  }
  return [...liabilities].sort((a, b) =>
    compareCryptoByNetworkProtocolValue(
      {
        network: a.network,
        protocol: a.protocol,
        value: a.balance,
        label: a.name,
      },
      {
        network: b.network,
        protocol: b.protocol,
        value: b.balance,
        label: b.name,
      }
    )
  );
}

export function sortCashInSection(
  section: PortfolioSection,
  accounts: CashAccount[]
): CashAccount[] {
  if (!isCryptoAssetSection(section)) {
    return [...accounts].sort((a, b) => compareAlphabeticalDeferred(a.name, b.name));
  }
  return [...accounts].sort((a, b) =>
    compareCryptoByNetworkProtocolValue(
      {
        network: a.network,
        protocol: a.protocol,
        value: a.balance,
        label: a.name,
      },
      {
        network: b.network,
        protocol: b.protocol,
        value: b.balance,
        label: b.name,
      }
    )
  );
}
