import { useEffect } from "react";
import type { FieldValues, UseFormReset } from "react-hook-form";

/**
 * Resets a react-hook-form when a drawer opens or the edited entity changes.
 * Defers reset until after mount to avoid pre-mount state updates.
 */
export function useDrawerFormReset<T extends FieldValues>(
  open: boolean,
  reset: UseFormReset<T>,
  getValues: () => T,
  deps: unknown[]
) {
  useEffect(() => {
    if (!open) return;

    let active = true;
    const values = getValues();
    const frameId = requestAnimationFrame(() => {
      if (active) {
        reset(values);
      }
    });

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getValues is recreated each render; entity deps are enough
  }, [open, reset, ...deps]);
}
