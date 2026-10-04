import { useEffect, useRef } from "react";
import { CHAT_TITLE_MAX } from "@/data/chat";
import s from "./chat.module.css";
import { Icon } from "./ChatIcons";

// One semantic chat row (title button + hover/focus three-dot button + inline rename), used for Pinned and Recents.
export default function ChatListItem({ chat, active, renaming, menuOpen, onSelect, onOpenMenu, onRenameSubmit, onRenameCancel }) {
  const inputRef = useRef(null);
  const doneRef = useRef(false);
  const title = chat.title || "Untitled Session";

  useEffect(() => {
    if (renaming) {
      doneRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  function commit() {
    if (doneRef.current) return;
    doneRef.current = true;
    const value = inputRef.current?.value ?? "";
    // Empty or unchanged names are treated as a cancel; the existing title is kept.
    if (!value.trim() || value.trim() === chat.title) onRenameCancel();
    else onRenameSubmit(chat.id, value);
  }

  function cancel() {
    if (doneRef.current) return;
    doneRef.current = true;
    onRenameCancel();
  }

  if (renaming) {
    return (
      <li className={s["chat-row"]}>
        <form onSubmit={(event) => { event.preventDefault(); commit(); }}>
          <input
            ref={inputRef}
            className={s["chat-rename"]}
            defaultValue={chat.title}
            maxLength={CHAT_TITLE_MAX}
            aria-label="Chat name"
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                cancel();
              }
            }}
          />
        </form>
      </li>
    );
  }

  return (
    <li className={`${s["chat-row"]} ${active ? s["row-active"] : ""}`}>
      <button
        className={s["chat-row-main"]}
        type="button"
        title={title}
        aria-current={active ? "true" : undefined}
        onClick={() => onSelect(chat.id)}
      >
        <span>{title}</span>
      </button>
      <button
        className={s["chat-row-more"]}
        type="button"
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => onOpenMenu(chat, event.currentTarget)}
      >
        <Icon name="more" size={18} />
      </button>
    </li>
  );
}
