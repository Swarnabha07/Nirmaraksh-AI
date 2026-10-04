import { useEffect, useLayoutEffect, useRef, useState } from "react";
import s from "./chat.module.css";
import { Icon } from "./ChatIcons";

// Rendered by ChatLayout (outside the sidebar) so the sidebar's clip-path and mobile transform can't clip it.
export default function ChatActionsMenu({ chat, anchorRect, trigger, onClose, onRename, onTogglePin, onDelete }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ top: anchorRect.bottom + 6, left: anchorRect.right - 176 });

  useLayoutEffect(() => {
    const { width, height } = ref.current.getBoundingClientRect();
    let top = anchorRect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, anchorRect.top - height - 6);
    const left = Math.min(Math.max(8, anchorRect.right - width), window.innerWidth - width - 8);
    setPosition({ top, left });
  }, [anchorRect]);

  useEffect(() => {
    ref.current.querySelector("[role='menuitem']")?.focus({ preventScroll: true });
    const onPointerDown = (event) => {
      if (ref.current.contains(event.target) || trigger?.contains(event.target)) return;
      onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        trigger?.focus();
        onClose();
      }
    };
    const dismiss = () => onClose();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", dismiss);
    document.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", dismiss);
      document.removeEventListener("scroll", dismiss, true);
    };
  }, [onClose, trigger]);

  function onMenuKeyDown(event) {
    const items = [...ref.current.querySelectorAll("[role='menuitem']")];
    const index = items.indexOf(document.activeElement);
    let next = null;
    if (event.key === "ArrowDown") next = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp") next = items[(index - 1 + items.length) % items.length];
    else if (event.key === "Home") next = items[0];
    else if (event.key === "End") next = items[items.length - 1];
    else if (event.key === "Tab") onClose();
    if (next) {
      event.preventDefault();
      next.focus();
    }
  }

  return (
    <div
      ref={ref}
      className={s["chat-menu"]}
      role="menu"
      aria-label={`Actions for ${chat.title}`}
      style={{ top: position.top, left: position.left }}
      onKeyDown={onMenuKeyDown}
    >
      <button type="button" role="menuitem" onClick={onRename}><Icon name="rename" size={18} /> Rename</button>
      <button type="button" role="menuitem" onClick={onTogglePin}><Icon name="pin" size={18} /> {chat.pinned ? "Unpin Chat" : "Pin Chat"}</button>
      <button type="button" role="menuitem" className={s.danger} onClick={onDelete}><Icon name="trash" size={18} /> Delete</button>
    </div>
  );
}
