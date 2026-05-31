import type { PageType, PortfolioSection } from "@/types";

export function getSectionsForPage(
  sections: PortfolioSection[],
  page: PageType
): PortfolioSection[] {
  return sections
    .filter((s) => s.page === page)
    .sort((a, b) => a.order - b.order);
}

export function createEntityId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createSectionId(page: PageType): string {
  return createEntityId(`${page}-section`);
}
