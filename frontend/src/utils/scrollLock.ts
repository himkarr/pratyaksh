import { useEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  lockCount++;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
}

/**
 * React hook to lock body scrolling when a modal/dialog is mounted or active.
 * Restores original scrolling when unmounted or when isLocked becomes false.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
