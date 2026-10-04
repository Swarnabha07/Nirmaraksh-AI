import { useEffect, useRef } from "react";

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

/** Escape to close, Tab focus trap, initial focus, focus restore and background scroll lock for /chat popups. */
export default function useModalBehavior({ containerRef, initialFocusRef, onClose }) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocusRef?.current ?? container.querySelector(FOCUSABLE))?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = container.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [containerRef, initialFocusRef]);
}
