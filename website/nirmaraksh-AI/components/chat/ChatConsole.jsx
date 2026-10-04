"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chatGreeting } from "@/data/chat";
import s from "./chat.module.css";
import { Icon } from "./ChatIcons";
import useVoiceInput from "./useVoiceInput";

const STARTER_PROMPTS = [
  {
    icon: "search",
    title: "Port Reconnaissance",
    prompt:
      "Scan authorized target for open ports with safe service fingerprinting",
  },
  {
    icon: "tools",
    title: "OWASP API Top 10",
    prompt:
      "Explain OWASP API Security Top 10 vulnerabilities and how to test for BOLA",
  },
  {
    icon: "pin",
    title: "AWS IAM Privilege Escalation",
    prompt: "Audit AWS IAM roles and privilege escalation attack vectors",
  },
  {
    icon: "chat",
    title: "Agentic Architecture",
    prompt:
      "How does the Nirmaraksh 5-agent ecosystem coordinate authorized penetration testing?",
  },
];

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={s["code-wrapper"]}>
      <div className={s["code-header"]}>
        <span className={s["code-lang"]}>{language || "bash"}</span>
        <button
          className={s["code-copy-btn"]}
          onClick={copyCode}
          type="button"
          aria-label="Copy code"
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className={s["code-pre"]}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Copies a whole assistant message (raw text) from the message footer. Shows "Copied!" briefly on success, reports failure via onError.
function CopyMessageButton({ text, onError }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      onError?.();
    }
  }

  return (
    <button
      type="button"
      className={`${s["expand-btn"]} ${s["expand-footer-btn"]}`}
      aria-label={copied ? "Response copied" : "Copy response"}
      onClick={copyMessage}
    >
      <Icon name={copied ? "check" : "copy"} size={14} />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function FormattedContent({ content }) {
  if (!content) return null;

  // Split content by code blocks ```...```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={s["formatted-text"]}>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/^```(\w+)?\n([\s\S]*?)```$/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock code={code.trim()} language={lang} key={index} />;
        }

        // Split text lines for headers, lists, and quotes
        const lines = part.split("\n");
        return (
          <div key={index} className={s["text-block"]}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className={s["line-gap"]} />;

              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lIdx} className={s["msg-h4"]}>
                    {trimmed.slice(4)}
                  </h4>
                );
              }
              if (trimmed.startsWith("#### ")) {
                return (
                  <h5 key={lIdx} className={s["msg-h5"]}>
                    {trimmed.slice(5)}
                  </h5>
                );
              }
              if (trimmed.startsWith("- ")) {
                return (
                  <li key={lIdx} className={s["msg-li"]}>
                    {renderInlineFormatted(trimmed.slice(2))}
                  </li>
                );
              }
              if (trimmed.startsWith("> ")) {
                return (
                  <blockquote key={lIdx} className={s["msg-quote"]}>
                    {renderInlineFormatted(trimmed.slice(2))}
                  </blockquote>
                );
              }

              return (
                <p key={lIdx} className={s["msg-p"]}>
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const MARKDOWN_LINK = /\[([^\]]+)\]\((\/[^\s)]+)\)/g; // only internal links, e.g. [Download Nirmaraksh Desktop](/download)

function renderInlineFormatted(str) {
  // Simple inline token parser for **bold**, `code`, and [text](/internal-link)
  const tokens = str.split(/(\*\*.*?\*\*|`.*?`|\[[^\]]+\]\(\/[^\s)]+\))/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className={s["inline-bold"]}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={i} className={s["inline-code"]}>
          {token.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = MARKDOWN_LINK.exec(token);
    MARKDOWN_LINK.lastIndex = 0;
    if (linkMatch && linkMatch[0] === token) {
      return (
        <Link key={i} href={linkMatch[2]} className={s["msg-link"]}>
          {linkMatch[1]}
        </Link>
      );
    }
    return token;
  });
}

const MAX_INPUT_HEIGHT = 42; // two lines inside the fixed-height composer

export default function ChatConsole({
  messages,
  isStreaming,
  onSend,
  onStop,
  onOpenUpgrade,
  onVoiceListeningChange,
  onExpandMessage,
}) {
  const [input, setInput] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);
  const toastTimer = useRef(null);

  function showNotice(message) {
    setToastMessage(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Browser speech recognition only (no external/backend transcription). The transcript lands in the editable input.
  const voice = useVoiceInput({
    onTranscript: (text) =>
      setInput((current) =>
        current.trim() ? `${current.trimEnd()} ${text}` : text,
      ),
    onError: ({ message }) => showNotice(message),
  });
  const isListening = voice.status === "listening";

  useEffect(() => {
    onVoiceListeningChange?.(isListening);
  }, [isListening, onVoiceListeningChange]);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [input]);

  useEffect(() => {
    const node = conversationRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isStreaming]);

  function submitMessage(event) {
    if (event) event.preventDefault();
    const value = input.trim();
    if (!value || isStreaming || voice.status !== "idle") return;
    onSend(value);
    setInput("");
  }

  function handleKeyDown(e) {
    // Enter sends, Shift+Enter inserts a newline. Ignore Enter while an IME is composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitMessage();
    }
  }

  function triggerStarter(promptText) {
    if (isStreaming) return;
    onSend(promptText);
  }

  return (
    <section className={s["chat-console"]} aria-label="Chat with Nirmaraksh">
      <div className={s["console-edge"]} aria-hidden="true" />

      {toastMessage && (
        <div className={s["toast-banner"]} role="status">
          <span>🛡️ {toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)}>
            ×
          </button>
        </div>
      )}

      <div
        className={s.conversation}
        ref={conversationRef}
        role="log"
        aria-live="polite"
      >
        <div className={s["ai-message"]}>
          <span className={s["message-accent"]} aria-hidden="true" />
          <div className={s["message-body"]}>
            <p className={s["author-tag"]}>
              <strong>NIRMARAKSH</strong>
            </p>
            <p>{chatGreeting.join(" ")}</p>
          </div>
        </div>

        {messages.map((message, index) => {
          const key = message.id || `msg-${index}`;
          if (message.role === "user") {
            return (
              <div className={s["user-message"]} key={key}>
                <strong>You:</strong> {message.content}
              </div>
            );
          }
          return (
            <div className={s["ai-message"]} key={key}>
              <span className={s["message-accent"]} aria-hidden="true" />
              <div className={s["message-body"]}>
                <p className={s["author-tag"]}>
                  <strong>NIRMARAKSH</strong>
                </p>
                {message.content ? (
                  <FormattedContent content={message.content} />
                ) : isStreaming ? (
                  <span className={s["typing-indicator"]}>
                    Analyzing vector and threat database...
                  </span>
                ) : null}
                {message.content && message.id && (
                  <div className={s["expand-footer"]}>
                    <CopyMessageButton
                      text={message.content}
                      onError={() =>
                        showNotice("Couldn't copy to the clipboard.")
                      }
                    />
                    <button
                      type="button"
                      className={`${s["expand-btn"]} ${s["expand-footer-btn"]}`}
                      aria-haspopup="dialog"
                      onClick={() => onExpandMessage?.(message.id)}
                    >
                      <Icon name="expand" size={14} />
                      Expand response
                    </button>
                  </div>
                )}
                {message.content && message.id && (
                  <button
                    type="button"
                    className={s["expand-btn"]}
                    aria-label="Expand message"
                    aria-haspopup="dialog"
                    title="Expand message"
                    onClick={() => onExpandMessage?.(message.id)}
                  >
                    <Icon name="expand" size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className={s["starters-container"]}>
            <p className={s["starters-title"]}>
              <span>⚡ Suggested Security Workflows:</span>
            </p>
            <div className={s["starters-grid"]}>
              {STARTER_PROMPTS.map((sp) => (
                <button
                  key={sp.title}
                  type="button"
                  className={s["starter-chip"]}
                  onClick={() => triggerStarter(sp.prompt)}
                  disabled={isStreaming}
                >
                  <Icon name={sp.icon} size={15} />
                  <span>{sp.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form className={s.composer} onSubmit={submitMessage}>
        <button
          type="button"
          aria-label="Add attachment"
          aria-haspopup="dialog"
          onClick={onOpenUpgrade}
        >
          <Icon name="plus" size={26} />
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          aria-label="Message Nirmaraksh"
          autoComplete="off"
          disabled={isStreaming}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? "Nirmaraksh is analyzing..."
              : "Ask a cybersecurity question or describe an assessment..."
          }
          value={input}
        />
        <button
          className={isListening ? s["mic-active"] : undefined}
          type="button"
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          aria-pressed={isListening}
          disabled={voice.status === "processing"}
          onClick={voice.toggle}
        >
          <Icon name="mic" size={21} />
        </button>
        <span className={s["composer-divider"]} />
        {isStreaming ? (
          <button
            className={`${s.send} ${s["stop-btn"]}`}
            type="button"
            aria-label="Stop generation"
            onClick={onStop}
            title="Stop generation"
          >
            <Icon name="stop" size={20} />
          </button>
        ) : (
          <button
            className={s.send}
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || voice.status !== "idle"}
          >
            <Icon name="send" size={22} />
          </button>
        )}
      </form>
    </section>
  );
}
