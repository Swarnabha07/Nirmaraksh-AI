import { FormEvent, useState } from "react";

type IconName =
  | "home"
  | "search"
  | "tools"
  | "pin"
  | "clock"
  | "plus"
  | "send"
  | "mic"
  | "chat"
  | "collapse";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </>
    ),
    tools: (
      <>
        <path d="m14.5 5.5 4-4 4 4-4 4M13 7l4 4M3 21l8.5-8.5" />
        <path d="M9 5 5 1 1 5l4 4M7 7l14 14M4 20l-1 1" />
      </>
    ),
    pin: (
      <>
        <path d="M8 3h8l-1.5 6 3.5 3H6l3.5-3zM12 12v9" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    send: <path d="m3 4 18 8-18 8 3-8zM6 12h15" />,
    mic: (
      <>
        <rect x="8" y="2" width="8" height="14" rx="4" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v12H9l-5 4z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    collapse: <path d="m15 6-6 6 6 6M20 6l-6 6 6 6" />,
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

function LogoMark() {
  return (
    <svg aria-hidden="true" className="logo-mark" viewBox="0 0 42 38">
      <path d="M4 4h9l22 30h-9z" fill="currentColor" />
      <path d="M29 4h9v30h-9zM4 13h9v21H4z" fill="currentColor" />
      <path d="m5 4 9 9h-4L1 4z" fill="#08e8ff" opacity=".75" />
    </svg>
  );
}

function AiPortrait() {
  return (
    <div
      className="portrait"
      aria-label="Nirmaraksh AI core"
      style={{
        background:
          "radial-gradient(circle at 50% 48%, rgba(0, 229, 239, 0.2) 0%, rgba(2, 24, 35, 0.72) 58%, #020d16 100%)",
      }}
    >
      <img
        className="portrait-figure"
        src="/assets/nirmaraksh-character.png"
        alt="Nirmaraksh"
        style={{
          objectPosition: "50% 42%",
          filter:
            "saturate(1.08) contrast(1.05) drop-shadow(0 0 10px rgba(0, 229, 242, 0.45))",
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 300 300"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          filter: "drop-shadow(0 0 5px rgba(242, 196, 57, 0.72))",
        }}
      >
        <circle
          cx="150"
          cy="150"
          r="139"
          fill="none"
          stroke="#f1cc58"
          strokeWidth="2"
          strokeDasharray="62 9 4 13"
          opacity=".88"
        />
        <circle
          cx="150"
          cy="150"
          r="132"
          fill="none"
          stroke="#d9a92d"
          strokeWidth="1.2"
          strokeDasharray="2 8 34 10"
          opacity=".72"
        />
        <circle
          cx="150"
          cy="150"
          r="122"
          fill="none"
          stroke="#f6d96d"
          strokeWidth=".8"
          strokeDasharray="1 7"
          opacity=".55"
        />
        <g fill="#ffe27b">
          <circle cx="62" cy="47" r="2.2" />
          <circle cx="238" cy="56" r="1.8" />
          <circle cx="269" cy="142" r="2.1" />
          <circle cx="47" cy="216" r="1.8" />
          <circle cx="222" cy="257" r="2.2" />
        </g>
        <g stroke="#e7b836" strokeWidth="1.5" opacity=".85">
          <path d="M36 107h17l7 7" />
          <path d="M240 43h17l8 8" />
          <path d="M249 238h15l8-8" />
          <path d="M29 174h18" />
        </g>
      </svg>
    </div>
  );
}

function Waveform({ small = false }: { small?: boolean }) {
  const bars = Array.from({ length: small ? 8 : 38 }, (_, index) => index);
  return (
    <div className={small ? "waveform mini" : "waveform"} aria-hidden="true">
      {bars.map((bar) => (
        <i key={bar} style={{ animationDelay: `${(bar % 9) * -0.11}s` }} />
      ))}
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setMessages((current) => [...current, value]);
    setInput("");
  }

  return (
    <main className="workspace">
      <div className="circuit-layer" aria-hidden="true" />
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <button
        className="mobile-menu"
        onClick={() => setSidebarOpen(true)}
        type="button"
        aria-label="Open navigation"
      >
        <LogoMark />
      </button>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <header className="brand">
          <LogoMark />
          <strong>NIRMARAKSH</strong>
          <button className="header-action search-action" type="button" aria-label="Search">
            <Icon name="search" size={21} />
          </button>
          <button
            className="header-action"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Collapse sidebar"
          >
            <Icon name="collapse" size={20} />
          </button>
        </header>

        <button className="new-chat" onClick={() => setMessages([])} type="button">
          <span><Icon name="chat" /></span>
          New Chat
        </button>

        <nav className="primary-nav" aria-label="Workspace sections">
          {[
            ["home", "Main"],
            ["search", "Research"],
            ["tools", "Builder"],
          ].map(([icon, label]) => (
            <button key={label} type="button">
              <Icon name={icon as IconName} />
              <span>{label}</span>
              <b>›</b>
            </button>
          ))}
        </nav>

        <section className="side-section pinned">
          <div className="section-title">
            <span><Icon name="pin" size={19} /> Pinned</span>
            <button type="button" aria-label="Add pinned chat"><Icon name="plus" size={18} /></button>
          </div>
          <p>No pinned chats yet</p>
          <small>Pin your important conversations<br />for quick access.</small>
        </section>

        <section className="side-section recents">
          <div className="section-title">
            <span><Icon name="clock" size={19} /> Recent Chats</span>
          </div>
          <div className="empty-recents">
            <span className="empty-icon"><Icon name="chat" size={21} /></span>
            <p>No recent chats yet.</p>
            <small>Start a new conversation to begin using Nirmaraksh.</small>
          </div>
        </section>

        <footer className="profile">
          <div className="profile-mark"><LogoMark /><i /></div>
          <div>
            <strong>Snehasish Saha</strong>
            <span>Free</span>
          </div>
          <b>›</b>
        </footer>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <section className="stage">
        <div className="core-wrap">
          <div className="hud-corners" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="hud-ring ring-one" />
          <div className="hud-ring ring-two" />
          <div className="hud-ring ring-three" />
          <AiPortrait />
        </div>

        <div className="status"><i /> IDLE <i /></div>
        <Waveform />

        <section className="chat-console" aria-label="Chat with Nirmaraksh">
          <div className="console-edge" aria-hidden="true" />
          <div className="conversation">
            <div className="ai-message">
              <span className="message-accent" aria-hidden="true" />
              <p><strong>NIRMARAKSH:</strong> Hello! I&apos;m Nirmaraksh.<br />How can I help you today?</p>
            </div>
            {messages.map((message, index) => (
              <div className="user-message" key={`${message}-${index}`}>
                <strong>You:</strong> {message}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="capabilities">
                <span className="message-accent" aria-hidden="true" />
                <p><strong>NIRMARAKSH:</strong> I can research, analyze, build,<br />and automate tasks for you.</p>
              </div>
            )}
          </div>

          <form className="composer" onSubmit={submitMessage}>
            <button className="attach" type="button" aria-label="Add attachment"><Icon name="plus" size={29} /></button>
            <input
              aria-label="Message Nirmaraksh"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Write a message..."
              value={input}
            />
            <button className="mic" type="button" aria-label="Voice input"><Icon name="mic" size={22} /></button>
            <span className="composer-divider" />
            {input.trim() ? (
              <button className="send" type="submit" aria-label="Send message"><Icon name="send" size={22} /></button>
            ) : (
              <Waveform small />
            )}
          </form>
        </section>
      </section>
    </main>
  );
}
