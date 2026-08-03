/** Browser confirm before destructive portfolio deletes. Returns true if the user confirmed. */
export function confirmDelete(entityLabel: string, name: string): boolean {
  const trimmed = name.trim() || "this item";
  return window.confirm(`Delete ${entityLabel} "${trimmed}"?\n\nThis cannot be undone.`);
}
