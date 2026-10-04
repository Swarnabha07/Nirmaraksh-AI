import { useRef, useState } from "react";
import s from "./chat.module.css";
import { Icon } from "./ChatIcons";
import useModalBehavior from "./useModalBehavior";

// Searches the chats that exist in the current in-memory state (pinned first), by title.
export default function ChatSearchModal({ chats, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useModalBehavior({ containerRef: panelRef, initialFocusRef: inputRef, onClose });

  const needle = query.trim().toLowerCase();
  const results = [...chats.filter((c) => c.pinned), ...chats.filter((c) => !c.pinned)].filter(
    (chat) => !needle || (chat.title || "").toLowerCase().includes(needle),
  );
  const buttons = () => [...(listRef.current?.querySelectorAll("button") ?? [])];

  function onInputKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      buttons()[0]?.focus();
    } else if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      onSelect(results[0].id);
    }
  }

  function onListKeyDown(event) {
    const items = buttons();
    const index = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[Math.min(index + 1, items.length - 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index <= 0) inputRef.current.focus();
      else items[index - 1].focus();
    }
  }

  return (
    <div className={s["modal-backdrop"]} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className={s.modal} role="dialog" aria-modal="true" aria-label="Search chats">
        <div className={s["search-box"]}>
          <Icon name="search" size={21} />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search chats"
            placeholder="Search chats..."
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <button type="button" className={s["modal-close"]} onClick={onClose} aria-label="Close search"><Icon name="close" size={18} /></button>
        </div>
        <div className={s["search-results"]} role="region" aria-live="polite" aria-label="Search results">
          {results.length > 0 ? (
            <ul ref={listRef} onKeyDown={onListKeyDown}>
              {results.map((chat) => (
                <li key={chat.id}>
                  <button type="button" className={s["search-result"]} onClick={() => onSelect(chat.id)}>
                    <Icon name={chat.pinned ? "pin" : "chat"} size={18} />
                    <span>{chat.title || "Untitled Session"}</span>
                    {chat.pinned && <em>Pinned</em>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s["search-empty"]}>{chats.length > 0 ? "No chats found" : "No chats yet"}</p>
          )}
        </div>
      </section>
    </div>
  );
}
