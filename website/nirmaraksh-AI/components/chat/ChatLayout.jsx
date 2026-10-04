"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import s from "./chat.module.css";
import AiCore from "./AiCore";
import ChatActionsMenu from "./ChatActionsMenu";
import ChatConsole from "./ChatConsole";
import { LogoMark } from "./ChatIcons";
import ChatSearchModal from "./ChatSearchModal";
import ChatSidebar from "./ChatSidebar";
import UpgradePopup from "./UpgradePopup";
import MessageExpandModal from "./MessageExpandModal";
import { CHAT_TITLE_MAX } from "@/data/chat";
import { streamTrialChat } from "@/lib/api";

// Matches the existing responsive breakpoint (mobile drawer at <= 800px).
const isDesktop = () => window.matchMedia("(min-width: 801px)").matches;

function createNewSession() {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: "New Security Session",
    messages: [],
    pinned: false,
    updatedAt: Date.now(),
  };
}

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop sidebar
  // Chats live in React memory only (intentionally no browser storage); a refresh resets them.
  const [chats, setChats] = useState(() => [createNewSession()]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [menu, setMenu] = useState(null); // { chatId, rect, trigger }
  const [renamingId, setRenamingId] = useState(null);
  const [expandedMessageId, setExpandedMessageId] = useState(null); // id only; the text is read live from chat state
  const abortControllerRef = useRef(null);

  // Keyboard navigation for closing sidebar
  useEffect(() => {
    if (!sidebarOpen || menu || searchOpen || upgradeOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, menu, searchOpen, upgradeOpen]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];
  const expandedMessage = expandedMessageId
    ? messages.find((m) => m.id === expandedMessageId && m.role === "assistant")
    : null;

  // Only chats that contain a message are listed; the empty working session stays hidden.
  const listedChats = useMemo(
    () =>
      chats
        .filter((c) => c.messages.length > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );

  const collapseSidebar = () =>
    isDesktop() ? setCollapsed(true) : setSidebarOpen(false);
  const openSidebar = () =>
    isDesktop() ? setCollapsed(false) : setSidebarOpen(true);

  function handleNewChat() {
    if (isStreaming) handleStop();
    const existingEmpty = chats.find((c) => c.messages.length === 0);
    if (existingEmpty) {
      setActiveChatId(existingEmpty.id);
    } else {
      const newSession = createNewSession();
      setChats((prev) => [newSession, ...prev]);
      setActiveChatId(newSession.id);
    }
    if (sidebarOpen) setSidebarOpen(false);
  }

  function handleSelectChat(id) {
    if (isStreaming) handleStop();
    setActiveChatId(id);
    setSearchOpen(false);
    if (sidebarOpen) setSidebarOpen(false);
  }

  function handleRenameChat(id, newTitle) {
    const title = newTitle.replace(/\s+/g, " ").trim().slice(0, CHAT_TITLE_MAX);
    if (!title) return;
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }

  function handlePinChat(id) {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }

  function handleDeleteChat(id) {
    const currentId = activeChat?.id;
    if (isStreaming && currentId === id) handleStop();
    if (renamingId === id) setRenamingId(null);

    const remaining = chats.filter((c) => c.id !== id);
    if (currentId !== id) {
      setChats(remaining);
      return;
    }
    // The open chat was deleted: continue in an empty session (reuse one if it exists).
    const emptySession = remaining.find((c) => c.messages.length === 0);
    if (emptySession) {
      setChats(remaining);
      setActiveChatId(emptySession.id);
    } else {
      const fresh = createNewSession();
      setChats([fresh, ...remaining]);
      setActiveChatId(fresh.id);
    }
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }

  const openMenu = (target, trigger) =>
    setMenu((current) =>
      current?.chatId === target.id
        ? null
        : { chatId: target.id, rect: trigger.getBoundingClientRect(), trigger },
    );
  const closeMenu = useCallback(() => setMenu(null), []);
  const menuChat = menu ? chats.find((c) => c.id === menu.chatId) : null;

  async function handleSend(userText) {
    if (isStreaming || !userText.trim()) return;

    const userMsgId = `u_${Date.now()}`;
    const assistantMsgId = `a_${Date.now()}`;

    const updatedUserMessages = [
      ...messages,
      { role: "user", content: userText, id: userMsgId },
    ];

    // Determine smart title from first user message if still default
    const isFirstMessage = messages.length === 0;
    const sessionTitle = isFirstMessage
      ? userText.slice(0, 32).trim() + (userText.length > 32 ? "..." : "")
      : activeChat.title;

    // Append empty assistant message for streaming
    const messagesWithPending = [
      ...updatedUserMessages,
      { role: "assistant", content: "", id: assistantMsgId },
    ];

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              title: sessionTitle,
              messages: messagesWithPending,
              updatedAt: Date.now(),
            }
          : c,
      ),
    );

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let assistantText = "";
      for await (const chunk of streamTrialChat(
        updatedUserMessages,
        abortController.signal,
      )) {
        assistantText += chunk;
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat.id
              ? {
                  ...c,
                  messages: [
                    ...updatedUserMessages,
                    {
                      role: "assistant",
                      content: assistantText,
                      id: assistantMsgId,
                    },
                  ],
                }
              : c,
          ),
        );
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat.id
              ? {
                  ...c,
                  messages: [
                    ...updatedUserMessages,
                    {
                      role: "assistant",
                      content:
                        err.message ||
                        "Network error communicating with the Nirmaraksh AI Agent.",
                      id: assistantMsgId,
                    },
                  ],
                }
              : c,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  return (
    <main className={`${s.workspace} ${collapsed ? s.collapsed : ""}`}>
      <div className={s["circuit-layer"]} aria-hidden="true" />
      <div className={s.particles} aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <button
        className={s["mobile-menu"]}
        onClick={openSidebar}
        type="button"
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
      >
        <LogoMark />
      </button>

      <ChatSidebar
        open={sidebarOpen}
        chats={listedChats}
        activeChatId={activeChat?.id}
        menuChatId={menu?.chatId ?? null}
        renamingId={renamingId}
        onCollapse={collapseSidebar}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onOpenMenu={openMenu}
        onRenameSubmit={(id, name) => {
          handleRenameChat(id, name);
          setRenamingId(null);
        }}
        onRenameCancel={() => setRenamingId(null)}
      />

      {sidebarOpen && (
        <button
          className={s["sidebar-scrim"]}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
          type="button"
        />
      )}

      <section className={s.stage}>
        <AiCore isStreaming={isStreaming} isVoiceListening={isVoiceListening} />
        <ChatConsole
          messages={messages}
          isStreaming={isStreaming}
          onSend={handleSend}
          onStop={handleStop}
          onOpenUpgrade={() => setUpgradeOpen(true)}
          onExpandMessage={setExpandedMessageId}
          onVoiceListeningChange={setIsVoiceListening}
        />
      </section>

      {menu && menuChat && (
        <ChatActionsMenu
          chat={menuChat}
          anchorRect={menu.rect}
          trigger={menu.trigger}
          onClose={closeMenu}
          onRename={() => {
            setRenamingId(menuChat.id);
            setMenu(null);
          }}
          onTogglePin={() => {
            handlePinChat(menuChat.id);
            setMenu(null);
          }}
          onDelete={() => {
            handleDeleteChat(menuChat.id);
            setMenu(null);
          }}
        />
      )}

      {searchOpen && (
        <ChatSearchModal
          chats={listedChats}
          onSelect={handleSelectChat}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {upgradeOpen && <UpgradePopup onClose={() => setUpgradeOpen(false)} />}
      {expandedMessage && (
        <MessageExpandModal
          content={expandedMessage.content}
          onClose={() => setExpandedMessageId(null)}
        />
      )}
    </main>
  );
}
