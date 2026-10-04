"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import DemoDialog from "@/components/ui/DemoDialog";

const DemoContext = createContext(null);

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside <DemoProvider>");
  return context;
}

/**
 * Owns the walkthrough dialog state so server-rendered sections can trigger it
 * through <DemoButton>. Swap `openDemo` for a route/sign-up navigation later.
 */
export default function DemoProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openDemo = useCallback(() => setOpen(true), []);
  const closeDemo = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openDemo, closeDemo }), [openDemo, closeDemo]);

  return (
    <DemoContext.Provider value={value}>
      {children}
      {open && <DemoDialog onClose={closeDemo} />}
    </DemoContext.Provider>
  );
}
