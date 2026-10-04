"use client";

import { agents } from "@/data/agents";
import { site } from "@/data/site";

const OVERVIEW = [
  `${site.name.toUpperCase()} — THE AGENTIC SECURITY WORKSPACE`,
  "",
  "Autonomous security testing powered by coordinated AI agents with human oversight.",
  "",
  "HOW IT WORKS",
  "The Manager Agent coordinates four specialized agents in one transparent workflow:",
  "",
  ...agents.map((agent) => `${agent.number}  ${agent.name} — ${agent.detail}`),
  "",
  "5 SPECIALIZED AGENTS  /  HUMAN CONTROLLED  /  FULL AUDIT TRAIL",
  "",
  `${site.name} brings autonomous execution and human judgment together in one security workspace.`,
  "",
].join("\n");

function downloadOverview() {
  const url = URL.createObjectURL(new Blob([OVERVIEW], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${site.name.toLowerCase()}-overview.txt`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DownloadOverviewButton({ children, ...props }) {
  return (
    <button type="button" onClick={downloadOverview} {...props}>
      {children}
    </button>
  );
}
