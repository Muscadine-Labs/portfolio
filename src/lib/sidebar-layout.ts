/** Desktop sidebar widths — keep shell padding in sync. */
export const SIDEBAR_WIDTH_EXPANDED = "16rem";
export const SIDEBAR_WIDTH_COMPACT = "4.5rem";

export function sidebarWidthClass(compact: boolean): string {
  return compact ? "w-[4.5rem]" : "w-64";
}

export function mainOffsetClass(compact: boolean): string {
  return compact ? "md:pl-[4.5rem]" : "md:pl-64";
}
