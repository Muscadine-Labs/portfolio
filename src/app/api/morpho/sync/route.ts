import { NextResponse } from "next/server";
import { fetchMorphoPositions } from "@/lib/morpho";
import { morphoChainIdForWallet } from "@/lib/wallet-address";
import type { WalletChain } from "@/types";

export async function POST(request: Request) {
  let body: {
    address?: string;
    chain?: string;
    walletId?: string;
    assetsSectionId?: string;
    cashSectionId?: string;
    liabilitiesSectionId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const address = body.address?.trim();
  const walletId = body.walletId?.trim() || "wallet";
  const chain = (body.chain ?? "base") as WalletChain;
  const morphoChainId = morphoChainIdForWallet(chain);

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "A valid EVM address is required for Morpho sync." }, { status: 400 });
  }

  if (!morphoChainId) {
    return NextResponse.json(
      { error: "Morpho sync is only supported on Ethereum and Base." },
      { status: 400 }
    );
  }

  const targets = {
    assetsSectionId: body.assetsSectionId?.trim() || undefined,
    cashSectionId: body.cashSectionId?.trim() || undefined,
    liabilitiesSectionId: body.liabilitiesSectionId?.trim() || undefined,
  };

  if (!targets.assetsSectionId && !targets.cashSectionId && !targets.liabilitiesSectionId) {
    return NextResponse.json(
      { error: "Link at least one portfolio section (assets, cash, or liabilities) before syncing." },
      { status: 400 }
    );
  }

  try {
    const result = await fetchMorphoPositions(address, morphoChainId, walletId, targets);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Morpho sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
