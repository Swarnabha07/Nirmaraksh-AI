"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { chatNav } from "@/data/chat";
import { getCurrentUser, signOut } from "@/lib/auth/authClient";
import { useAuthModal } from "@/components/auth/AuthProvider";
import s from "./chat.module.css";
import ChatListItem from "./ChatListItem";
import { Icon, LogoMark } from "./ChatIcons";

export default function ChatSidebar({
  open,
  chats = [],
  activeChatId,
  menuChatId,
  renamingId,
  onCollapse,
  onOpenSearch,
  onSelectChat,
  onNewChat,
  onOpenMenu,
  onRenameSubmit,
  onRenameCancel,
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const { openAuth } = useAuthModal();

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) setUser(currentUser);
      } catch {
        // Guest mode fallback
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut(e) {
    e.stopPropagation();
    setSignOutError("");
    const result = await signOut();
    if (result?.ok) {
      setUser(null);
      // /chat is auth-protected: leave it and drop any cached authenticated render.
      router.replace("/");
      router.refresh();
    } else {
      setSignOutError("Sign out failed. Try again.");
    }
  }

  const pinnedChats = chats.filter((c) => c.pinned);
  const recentChats = chats.filter((c) => !c.pinned);

  const renderRow = (chat) => (
    <ChatListItem
      key={chat.id}
      chat={chat}
      active={chat.id === activeChatId}
      renaming={chat.id === renamingId}
      menuOpen={chat.id === menuChatId}
      onSelect={onSelectChat}
      onOpenMenu={onOpenMenu}
      onRenameSubmit={onRenameSubmit}
      onRenameCancel={onRenameCancel}
    />
  );
  return (
    <aside className={`${s.sidebar} ${open ? s.open : ""}`} aria-label="Workspace sidebar">
      <header className={s.brand}>
        <Link href="/" className={s["brand-link"]} title="Back to Nirmaraksh Home">
          <LogoMark />
          <strong>NIRMARAKSH</strong>
        </Link>
        <button
          className={s["header-action"]}
          onClick={onOpenSearch}
          type="button"
          aria-label="Search chats"
          aria-haspopup="dialog"
          title="Search conversations"
        >
          <Icon name="search" size={19} />
        </button>
        <button
          className={s["header-action"]}
          onClick={onCollapse}
          type="button"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <Icon name="collapse" size={18} />
        </button>
      </header>

      <button className={s["new-chat"]} onClick={onNewChat} type="button">
        <span><Icon name="chat" /></span>
        New Security Session
      </button>

      <nav className={s["primary-nav"]} aria-label="Workspace sections">
        <Link href="/" className={s["nav-link"]}>
          <Icon name="home" />
          <span>Landing Overview</span>
          <b aria-hidden="true">›</b>
        </Link>
        {chatNav.map(({ icon, label }) => (
          <button key={label} type="button">
            <Icon name={icon} />
            <span>{label}</span>
            <b aria-hidden="true">›</b>
          </button>
        ))}
      </nav>

      {/* Pinned Chats */}
      <section className={`${s["side-section"]} ${s.pinned}`} aria-label="Pinned chats">
        <div className={s["section-title"]}>
          <span><Icon name="pin" size={17} /> Pinned Sessions</span>
        </div>
        {pinnedChats.length > 0 ? (
          <ul className={s["chat-list"]}>{pinnedChats.map(renderRow)}</ul>
        ) : (
          <div className={s["empty-state"]}>
            <p>No pinned chats yet</p>
            <small>Pin your important missions for quick access.</small>
          </div>
        )}
      </section>

      {/* Recent Chats */}
      <section className={`${s["side-section"]} ${s.recents}`} aria-label="Recent chats">
        <div className={s["section-title"]}>
          <span><Icon name="clock" size={17} /> Recent Sessions ({recentChats.length})</span>
        </div>
        {recentChats.length > 0 ? (
          <ul className={s["chat-list"]}>{recentChats.map(renderRow)}</ul>
        ) : (
          <div className={s["empty-recents"]}>
            <span className={s["empty-icon"]}><Icon name="chat" size={20} /></span>
            <p>No recent chats yet.</p>
            <small>Start a new conversation to begin using Nirmaraksh.</small>
          </div>
        )}
      </section>

      {/* Profile & Auth Footer */}
      <footer className={s.profile}>
        <div className={s["profile-mark"]}><LogoMark /><i /></div>
        <div className={s["profile-info"]}>
          {user ? (
            <>
              <strong>{user.user_metadata?.full_name || user.email?.split("@")[0]}</strong>
              <span>{signOutError || "Authorized Operator"}</span>
            </>
          ) : (
            <>
              <strong>Guest Operator</strong>
              <span>Web Trial Mode</span>
            </>
          )}
        </div>
        {user ? (
          <button
            className={s["auth-action-btn"]}
            onClick={handleSignOut}
            title="Sign Out"
            type="button"
          >
            Sign Out
          </button>
        ) : (
          <button
            className={s["auth-action-btn"]}
            onClick={openAuth}
            title="Sign In / Register"
            type="button"
          >
            Sign In
          </button>
        )}
      </footer>
    </aside>
  );
}
