/** Morpho Blue / vault positions via public GraphQL API (no on-chain SDK required). */

export interface MorphoSyncedAsset {
  id: string;
  name: string;
  symbol: string;
  sectionId: string;
  price: number;
  quantity: number;
  protocol: string;
  walletId: string;
}

export interface MorphoSyncedLiability {
  id: string;
  name: string;
  sectionId: string;
  balance: number;
  collateral?: number;
  lltv?: number;
  ltv?: number;
  protocol: string;
  address: string;
  walletId: string;
}

export interface MorphoSyncedCash {
  id: string;
  name: string;
  sectionId: string;
  balance: number;
  protocol: string;
  address: string;
  walletId: string;
}

export interface MorphoSyncResult {
  assets: MorphoSyncedAsset[];
  liabilities: MorphoSyncedLiability[];
  cashAccounts: MorphoSyncedCash[];
}

export interface MorphoSectionTargets {
  assetsSectionId: string;
  cashSectionId: string;
  liabilitiesSectionId: string;
}

const MORPHO_API = "https://api.morpho.org/graphql";

const USER_POSITIONS_QUERY = `
  query UserMorphoPositions($address: String!, $chainId: Int!) {
    userByAddress(address: $address, chainId: $chainId) {
      marketPositions {
        market {
          loanAsset { symbol }
          collateralAsset { symbol }
        }
        state {
          supplyAssetsUsd
          borrowAssetsUsd
          collateralUsd
        }
      }
      vaultPositions {
        vault { name address symbol }
        state { assetsUsd shares }
      }
      vaultV2Positions {
        vault { name address symbol }
        assetsUsd
        shares
      }
    }
  }
`;

type MarketPositionRow = {
  market: {
    loanAsset: { symbol: string } | null;
    collateralAsset: { symbol: string } | null;
  };
  state: {
    supplyAssetsUsd: number | null;
    borrowAssetsUsd: number | null;
    collateralUsd: number | null;
  };
};

type VaultV1PositionRow = {
  vault: { name: string; address: string; symbol?: string | null };
  state: { assetsUsd: number | null; shares?: number | null };
};

type VaultV2PositionRow = {
  vault: { name: string; address: string; symbol?: string | null };
  assetsUsd: number | null;
  shares?: number | null;
};

function marketLabel(row: MarketPositionRow): string {
  const loan = row.market.loanAsset?.symbol ?? "Loan";
  const collateral = row.market.collateralAsset?.symbol ?? "Collateral";
  return `${collateral}/${loan}`;
}

function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

export async function fetchMorphoPositions(
  address: string,
  chainId: number,
  walletId: string,
  targets: MorphoSectionTargets
): Promise<MorphoSyncResult> {
  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: USER_POSITIONS_QUERY,
      variables: { address: address.toLowerCase(), chainId },
    }),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Morpho API error (${res.status})`);
  }

  const json = (await res.json()) as {
    errors?: { message: string }[];
    data?: {
      userByAddress?: {
        marketPositions: MarketPositionRow[];
        vaultPositions: VaultV1PositionRow[];
        vaultV2Positions: VaultV2PositionRow[];
      } | null;
    };
  };

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "Morpho API query failed");
  }

  const user = json.data?.userByAddress;
  if (!user) {
    return { assets: [], liabilities: [], cashAccounts: [] };
  }

  const assets: MorphoSyncedAsset[] = [];
  const liabilities: MorphoSyncedLiability[] = [];
  const cashAccounts: MorphoSyncedCash[] = [];
  const shortAddress = `${address.slice(0, 6)}…${address.slice(-4)}`;

  for (const row of user.vaultV2Positions ?? []) {
    const usd = row.assetsUsd ?? 0;
    if (usd < 0.01) continue;
    const name = row.vault.name || "Morpho Vault V2";
    const symbol = row.vault.symbol?.trim() || "VAULT";
    assets.push({
      id: `morpho-${walletId}-vault-v2-${slug(row.vault.address)}`,
      name,
      symbol,
      sectionId: targets.assetsSectionId,
      price: usd,
      quantity: 1,
      protocol: "Morpho V2",
      walletId,
    });
  }

  for (const row of user.vaultPositions ?? []) {
    const usd = row.state?.assetsUsd ?? 0;
    if (usd < 0.01) continue;
    const name = row.vault.name || "Morpho Vault";
    const symbol = row.vault.symbol?.trim() || "VAULT";
    assets.push({
      id: `morpho-${walletId}-vault-v1-${slug(row.vault.address)}`,
      name,
      symbol,
      sectionId: targets.assetsSectionId,
      price: usd,
      quantity: 1,
      protocol: "Morpho V1",
      walletId,
    });
  }

  for (const row of user.marketPositions ?? []) {
    const label = marketLabel(row);
    const key = slug(label);
    const collateralUsd = row.state.collateralUsd ?? 0;
    const borrowUsd = row.state.borrowAssetsUsd ?? 0;
    const supplyUsd = row.state.supplyAssetsUsd ?? 0;

    if (collateralUsd >= 0.01) {
      const collateralSymbol = row.market.collateralAsset?.symbol ?? "Collateral";
      assets.push({
        id: `morpho-${walletId}-col-${key}`,
        name: `Morpho ${label} (collateral)`,
        symbol: collateralSymbol,
        sectionId: targets.assetsSectionId,
        price: collateralUsd,
        quantity: 1,
        protocol: "Morpho",
        walletId,
      });
    }

    if (borrowUsd >= 0.01) {
      const ltv = collateralUsd > 0 ? (borrowUsd / collateralUsd) * 100 : undefined;
      liabilities.push({
        id: `morpho-${walletId}-borrow-${key}`,
        name: `Morpho ${label}`,
        sectionId: targets.liabilitiesSectionId,
        balance: borrowUsd,
        collateral: collateralUsd > 0 ? collateralUsd : undefined,
        lltv: 86,
        ltv,
        protocol: "Morpho",
        address: shortAddress,
        walletId,
      });
    }

    if (supplyUsd >= 0.01) {
      const loanSymbol = row.market.loanAsset?.symbol ?? "Supply";
      cashAccounts.push({
        id: `morpho-${walletId}-supply-${key}`,
        name: `Morpho ${label} supply (${loanSymbol})`,
        sectionId: targets.cashSectionId,
        balance: supplyUsd,
        protocol: "Morpho",
        address: shortAddress,
        walletId,
      });
    }
  }

  return { assets, liabilities, cashAccounts };
}

export function isMorphoManagedId(id: string): boolean {
  return id.startsWith("morpho-");
}
