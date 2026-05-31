import type { PageType, PortfolioSection, WalletMapNode } from "@/types";

export type WalletLinkPage = "assets" | "cash" | "liabilities";

export type WalletSectionTargets = {
  assetsSectionId?: string;
  cashSectionId?: string;
  liabilitiesSectionId?: string;
};

const PAGE_TO_LINK_KEY: Record<
  WalletLinkPage,
  keyof NonNullable<WalletMapNode["links"]>
> = {
  assets: "assetsSectionId",
  cash: "cashSectionId",
  liabilities: "liabilitiesSectionId",
};

export function isWalletLinkPage(page: PageType): page is WalletLinkPage {
  return page === "assets" || page === "cash" || page === "liabilities";
}

export function walletLinkKeyForPage(
  page: PageType
): keyof NonNullable<WalletMapNode["links"]> | null {
  return isWalletLinkPage(page) ? PAGE_TO_LINK_KEY[page] : null;
}

export function resolveWalletSectionTargets(
  wallet: WalletMapNode,
  sections: PortfolioSection[]
): WalletSectionTargets {
  const fromLinks = wallet.links ?? {};
  return {
    assetsSectionId:
      fromLinks.assetsSectionId ??
      sections.find((s) => s.page === "assets" && s.metadata?.walletId === wallet.id)?.id,
    cashSectionId:
      fromLinks.cashSectionId ??
      sections.find((s) => s.page === "cash" && s.metadata?.walletId === wallet.id)?.id,
    liabilitiesSectionId:
      fromLinks.liabilitiesSectionId ??
      sections.find(
        (s) => s.page === "liabilities" && s.metadata?.walletId === wallet.id
      )?.id,
  };
}

export function hasMorphoSectionTarget(targets: WalletSectionTargets): boolean {
  return Boolean(
    targets.assetsSectionId || targets.cashSectionId || targets.liabilitiesSectionId
  );
}

function stripEmptyMetadata(
  metadata: PortfolioSection["metadata"]
): PortfolioSection["metadata"] | undefined {
  if (!metadata) return undefined;
  const next = { ...metadata };
  if (!next.walletId) delete next.walletId;
  if (!next.account) delete next.account;
  if (!next.overviewGroup) delete next.overviewGroup;
  if (next.isDefi !== true) delete next.isDefi;
  return Object.keys(next).length > 0 ? next : undefined;
}

function clearWalletLinkKey(
  wallet: WalletMapNode,
  linkKey: keyof NonNullable<WalletMapNode["links"]>
): WalletMapNode {
  const nextLinks = { ...(wallet.links ?? {}) };
  delete nextLinks[linkKey];
  const hasLinks = Object.values(nextLinks).some(Boolean);
  return { ...wallet, links: hasLinks ? nextLinks : undefined };
}

/** Wallet save → set `metadata.walletId` on linked sections; clear stale assignments. */
export function syncSectionsFromWalletLinks(
  sections: PortfolioSection[],
  wallet: WalletMapNode
): PortfolioSection[] {
  const walletId = wallet.id;
  const links = wallet.links ?? {};

  return sections.map((section) => {
    const linkKey = walletLinkKeyForPage(section.page);
    if (!linkKey) return section;

    const linkedSectionId = links[linkKey];
    const isTarget = linkedSectionId === section.id;
    const hadWallet = section.metadata?.walletId === walletId;

    if (isTarget) {
      if (section.metadata?.walletId === walletId) return section;
      return {
        ...section,
        metadata: { ...section.metadata, walletId },
      };
    }

    if (hadWallet) {
      const nextMeta = { ...section.metadata };
      delete nextMeta.walletId;
      return { ...section, metadata: stripEmptyMetadata(nextMeta) };
    }

    return section;
  });
}

/** Section save → update `wallet.links` and dedupe wallet assignments on the same page. */
export function syncWalletAndSectionsFromSectionLink(
  sections: PortfolioSection[],
  wallets: WalletMapNode[],
  section: PortfolioSection,
  previousWalletId?: string
): { sections: PortfolioSection[]; wallets: WalletMapNode[] } {
  const linkKey = walletLinkKeyForPage(section.page);
  if (!linkKey) return { sections, wallets };

  const newWalletId = section.metadata?.walletId;

  let nextSections = sections.map((s) =>
    s.id === section.id && s.page === section.page ? section : s
  );
  const exists = sections.some((s) => s.id === section.id && s.page === section.page);
  if (!exists) nextSections = [...nextSections, section];

  if (newWalletId) {
    nextSections = nextSections.map((s) => {
      if (s.page !== section.page || s.id === section.id) return s;
      if (s.metadata?.walletId !== newWalletId) return s;
      const nextMeta = { ...s.metadata };
      delete nextMeta.walletId;
      return { ...s, metadata: stripEmptyMetadata(nextMeta) };
    });
  }

  let nextWallets = wallets.map((wallet) => {
    if (wallet.links?.[linkKey] === section.id && wallet.id !== newWalletId) {
      return clearWalletLinkKey(wallet, linkKey);
    }
    return wallet;
  });

  if (previousWalletId && previousWalletId !== newWalletId) {
    nextWallets = nextWallets.map((wallet) => {
      if (wallet.id !== previousWalletId) return wallet;
      if (wallet.links?.[linkKey] === section.id) {
        return clearWalletLinkKey(wallet, linkKey);
      }
      return wallet;
    });
  }

  if (newWalletId) {
    nextWallets = nextWallets.map((wallet) => {
      if (wallet.id !== newWalletId) return wallet;
      return {
        ...wallet,
        links: { ...wallet.links, [linkKey]: section.id },
      };
    });
    const linkedWallet = nextWallets.find((w) => w.id === newWalletId);
    if (linkedWallet) {
      nextSections = syncSectionsFromWalletLinks(nextSections, linkedWallet);
    }
  }

  return { sections: nextSections, wallets: nextWallets };
}

export function sectionLabelForTarget(
  sections: PortfolioSection[],
  sectionId: string | undefined
): string | undefined {
  if (!sectionId) return undefined;
  return sections.find((s) => s.id === sectionId)?.label;
}
