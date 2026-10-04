"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const AuthContext = createContext(null);

export function useAuthModal() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthModal must be used inside <AuthProvider>");
  return context;
}

/** Owns the single shared authentication modal so server-rendered CTAs can open it through <AuthButton>. */
export default function AuthProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openAuth = useCallback(() => setOpen(true), []);
  const closeAuth = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openAuth, closeAuth }), [openAuth, closeAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {open && <AuthModal onClose={closeAuth} />}
    </AuthContext.Provider>
  );
}
