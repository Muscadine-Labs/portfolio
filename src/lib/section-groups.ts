import { createEntityId } from "@/lib/sections";
import type { PageType, PortfolioSection, SectionGroup, SectionGroupPage } from "@/types";

export const SECTION_GROUP_PAGES: SectionGroupPage[] = ["assets", "cash", "liabilities"];

export function isSectionGroupPage(page: PageType): page is SectionGroupPage {
  return SECTION_GROUP_PAGES.includes(page as SectionGroupPage);
}

export function createSectionGroupId(page: SectionGroupPage): string {
  return createEntityId(`${page}-group`);
}

export function getSectionGroupsForPage(
  groups: SectionGroup[],
  page: SectionGroupPage
): SectionGroup[] {
  return groups
    .filter((group) => group.page === page)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function formatSectionDisplayLabel(section: PortfolioSection): string {
  const account = section.metadata?.account?.trim();
  if (account) return `${section.label} · ${account}`;
  return section.label;
}

export type PageSectionLayout =
  | {
      kind: "group";
      group: SectionGroup;
      sections: PortfolioSection[];
      total: number;
    }
  | {
      kind: "ungrouped";
      sections: PortfolioSection[];
      total: number;
    };

export function buildPageSectionLayout(
  page: SectionGroupPage,
  groups: SectionGroup[],
  sections: PortfolioSection[],
  valueBySectionId: Map<string, number> | Record<string, number>,
  sortByValue = true
): PageSectionLayout[] {
  const valueOf = (sectionId: string) =>
    valueBySectionId instanceof Map
      ? (valueBySectionId.get(sectionId) ?? 0)
      : (valueBySectionId[sectionId] ?? 0);

  const pageSections = sections
    .filter((section) => section.page === page)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  const pageGroups = getSectionGroupsForPage(groups, page);
  const layout: PageSectionLayout[] = [];

  for (const group of pageGroups) {
    const members = pageSections.filter((section) => section.groupId === group.id);
    const total = members.reduce((sum, section) => sum + valueOf(section.id), 0);
    layout.push({ kind: "group", group, sections: members, total });
  }

  const ungrouped = pageSections.filter((section) => !section.groupId);
  if (ungrouped.length > 0) {
    const total = ungrouped.reduce((sum, section) => sum + valueOf(section.id), 0);
    layout.push({ kind: "ungrouped", sections: ungrouped, total });
  }

  if (!sortByValue) return layout;

  return [...layout].sort((a, b) => {
    if (a.kind === "ungrouped" && b.kind !== "ungrouped") return 1;
    if (b.kind === "ungrouped" && a.kind !== "ungrouped") return -1;
    return b.total - a.total;
  });
}

/** Migrate legacy metadata.overviewGroup strings into first-class sectionGroups. */
export function migrateAndNormalizeSectionGroups(
  sections: PortfolioSection[],
  sectionGroups: SectionGroup[] = []
): { sections: PortfolioSection[]; sectionGroups: SectionGroup[] } {
  const groups = [...sectionGroups];
  const groupByKey = new Map<string, SectionGroup>();
  for (const group of groups) {
    groupByKey.set(`${group.page}:${group.name.trim().toLowerCase()}`, group);
  }

  const migratedSections = sections.map((section) => {
    let next = { ...section };

    if (!next.groupId) {
      const legacy = next.metadata?.overviewGroup?.trim();
      if (legacy && isSectionGroupPage(next.page)) {
        const key = `${next.page}:${legacy.toLowerCase()}`;
        let group = groupByKey.get(key);
        if (!group) {
          group = {
            id: createSectionGroupId(next.page),
            page: next.page,
            name: legacy,
            order: groups.filter((g) => g.page === next.page).length,
          };
          groups.push(group);
          groupByKey.set(key, group);
        }
        next = { ...next, groupId: group.id };
      }
    }

    if (next.metadata?.overviewGroup) {
      const metadata = { ...next.metadata };
      delete metadata.overviewGroup;
      next = {
        ...next,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    }

    return next;
  });

  const groupIds = new Set(groups.map((group) => group.id));
  const cleanedSections = migratedSections.map((section) => {
    if (section.groupId && !groupIds.has(section.groupId)) {
      const rest = { ...section };
      delete rest.groupId;
      return rest;
    }
    return section;
  });

  return { sections: cleanedSections, sectionGroups: groups };
}

export function sectionFilterMatches(
  filter: string,
  section: PortfolioSection
): boolean {
  if (filter === "all") return true;
  if (filter.startsWith("group:")) {
    return section.groupId === filter.slice("group:".length);
  }
  return section.id === filter;
}
