"use client";

import { useEffect, useRef, useState } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import { ArrowIcon } from "@/components/ui/Icons";

const FOCUSABLE = "button, [href], [tabindex]:not([tabindex='-1'])";

export default function DemoDialog({ onClose }) {
  const [playing, setPlaying] = useState(true);
  const dialogRef = useRef(null);
  const videoRef = useRef(null);

  // Autoplay can be refused by the browser; keep the Play/Pause label truthful if so.
  useEffect(() => {
    videoRef.current?.play().catch(() => setPlaying(false));
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

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
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="demo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
      >
        <div className="dialog-top">
          <Eyebrow as="span">PRODUCT WALKTHROUGH</Eyebrow>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close demo"
          >
            ×
          </button>
        </div>
        <h2 id="demo-title">See the agents in action.</h2>
        <p>
          One coordinated workflow. Every step visible, verifiable, and under
          your control.
        </p>
        <div className="demo-screen demo-screen-video">
          <video
            ref={videoRef}
            src="/videos/nirmaraksh-ai-demo.mp4"
            controls
            autoPlay
            playsInline
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        </div>
        <div className="dialog-bottom">
          <span>Guided product preview</span>
          <button type="button" onClick={togglePlayback}>
            {playing ? "Pause preview" : "Play preview"} <ArrowIcon />
          </button>
        </div>
      </section>
    </div>
  );
}
