/**
 * Promote a floating surface to the browser top layer when the Popover API is
 * available. Keeping this in one place makes every Fluid overlay degrade to
 * its fixed-position fallback in older/test browsers without duplicating the
 * defensive API checks.
 */
export function showInTopLayer(element: HTMLElement | undefined): void {
  const popover = element as (HTMLElement & { showPopover?: () => void }) | undefined;
  if (typeof popover?.showPopover !== "function") return;

  try {
    popover.showPopover();
  } catch {
    // The element may already be open or may have disconnected between the
    // Lit update and this call. Either state is safe to ignore.
  }
}

/** Remove a floating surface from the browser top layer when supported. */
export function hideFromTopLayer(element: HTMLElement | undefined): void {
  const popover = element as (HTMLElement & { hidePopover?: () => void }) | undefined;
  if (typeof popover?.hidePopover !== "function") return;

  try {
    popover.hidePopover();
  } catch {
    // Closing an already closed/disconnected popover is intentionally a no-op.
  }
}
