import { useEffect, useRef, useState } from "react";
import s from "./chat.module.css";
import { Icon } from "./ChatIcons";
import { FormattedContent } from "./ChatConsole";
import useModalBehavior from "./useModalBehavior";

const CLOSE_MS = 160; // matches the fadeOut/popOut duration in chat.module.css

// Large reading view for one assistant message. Renders the same FormattedContent as the chat, so formatting is identical.
// `content` comes from ChatLayout's live chat state, so it keeps updating while the message is still streaming.
export default function MessageExpandModal({ content, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const timerRef = useRef(null);
  const [closing, setClosing] = useState(false);

  function requestClose() {
    if (timerRef.current) return;
    setClosing(true);
    timerRef.current = setTimeout(onClose, CLOSE_MS);
  }
  useEffect(() => () => clearTimeout(timerRef.current), []);

  useModalBehavior({
    containerRef: panelRef,
    initialFocusRef: closeRef,
    onClose: requestClose,
  });

  return (
    <div
      className={`${s["modal-backdrop"]} ${s.center} ${closing ? s.closing : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        ref={panelRef}
        className={`${s.modal} ${s["expand-modal"]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expand-title"
      >
        <header className={`${s["modal-head"]} ${s["expand-head"]}`}>
          <div>
            <span className={s["modal-eyebrow"]}>NIRMARAKSH</span>
            <h2 id="expand-title">Assistant response</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={s["modal-close"]}
            onClick={requestClose}
            aria-label="Close expanded message"
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div
          className={s["expand-body"]}
          tabIndex={0}
          role="region"
          aria-label="Full assistant response"
        >
          <FormattedContent content={content} />
        </div>
      </section>
    </div>
  );
}
