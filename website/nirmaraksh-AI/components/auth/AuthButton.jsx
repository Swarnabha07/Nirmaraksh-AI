"use client";

import { useAuthModal } from "@/components/auth/AuthProvider";

export default function AuthButton({ children, ...props }) {
  const { openAuth } = useAuthModal();
  return (
    <button type="button" onClick={openAuth} aria-haspopup="dialog" {...props}>
      {children}
    </button>
  );
}
