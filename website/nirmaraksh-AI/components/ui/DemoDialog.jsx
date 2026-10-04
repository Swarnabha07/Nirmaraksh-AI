"use client";

import { useEffect, useRef, useState } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import { AgentIcon, ArrowIcon } from "@/components/ui/Icons";
import { agents, demoSteps } from "@/data/agents";

const STEP_INTERVAL_MS = 3200;
const FOCUSABLE = "button, [href], [tabindex]:not([tabindex='-1'])";

export default function DemoDialog({ onClose }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => setStep((current) => (current + 1) % demoSteps.length), STEP_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    dialog.querySelector(".close-button")?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab") return;
      const items = dialog.querySelectorAll(FOCUSABLE);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="demo-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-title">
        <div className="dialog-top">
          <Eyebrow as="span">PRODUCT WALKTHROUGH</Eyebrow>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close demo">×</button>
        </div>
        <h2 id="demo-title">See the agents in action.</h2>
        <p>One coordinated workflow. Every step visible, verifiable, and under your control.</p>
        <div className="demo-screen">
          <div className="demo-screen-top">
            <span><span className="live-dot" /> LIVE WORKFLOW</span>
            <span>STEP 0{step + 1} / 04</span>
          </div>
          <div className="demo-center-icon"><AgentIcon kind={agents[step].kind} /></div>
          <span className="demo-agent-name">{demoSteps[step].agent}</span>
          <h3>{demoSteps[step].title}</h3>
          <p>{demoSteps[step].description}</p>
          <div className="demo-step-track">
            {demoSteps.map((item, index) => (
              <button
                key={item.agent}
                type="button"
                className={index === step ? "active" : ""}
                onClick={() => { setStep(index); setPlaying(false); }}
                aria-label={`Show ${item.agent} step`}
              />
            ))}
          </div>
        </div>
        <div className="dialog-bottom">
          <span>Guided product preview</span>
          <button type="button" onClick={() => setPlaying(!playing)}>
            {playing ? "Pause preview" : "Play preview"} <ArrowIcon />
          </button>
        </div>
      </section>
    </div>
  );
}
