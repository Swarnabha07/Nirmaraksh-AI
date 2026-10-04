"use client";

import { useDemo } from "@/components/ui/DemoProvider";

export default function DemoButton({ children, ...props }) {
  const { openDemo } = useDemo();
  return (
    <button type="button" onClick={openDemo} {...props}>
      {children}
    </button>
  );
}
