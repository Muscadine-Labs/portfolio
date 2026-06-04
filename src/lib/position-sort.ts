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
