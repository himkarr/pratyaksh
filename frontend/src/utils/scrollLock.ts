import { useEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  lockCount++;
}

export function unlockBodyScroll(force: boolean = false) {
  if (typeof document === "undefined") return;
  if (force) {
    lockCount = 0;
  } else {
    lockCount = Math.max(0, lockCount - 1);
  }
  if (lockCount === 0) {
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
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
