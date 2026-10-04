"use client";

import { useRef, useState } from "react";
import { AgentIcon, ArrowIcon, FeatureIcon, RadialGeometry } from "@/components/ui/Icons";
import { agents } from "@/data/agents";

const MODULE_STATUS = {
  recon: "SCANNING SURFACE",
  analysis: "CONNECTING SIGNALS",
  verification: "VALIDATING EVIDENCE",
  reporting: "BUILDING AUDIT TRAIL",
};
const PARALLAX_RANGE_PX = 10;
const HEX_NODES = [0, 1, 2, 3, 4, 5];

function Indices({ count }) {
  return Array.from({ length: count }, (_, index) => <i key={index} />);
}

export default function SecurityCore() {
  const [selected, setSelected] = useState("manager");
  const [paused, setPaused] = useState(false);
  const stage = useRef(null);
  const active = agents.find((agent) => agent.kind === selected);

  function movePointer(event) {
    if (paused || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * PARALLAX_RANGE_PX;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * PARALLAX_RANGE_PX;
    stage.current?.style.setProperty("--pointer-x", `${x}px`);
    stage.current?.style.setProperty("--pointer-y", `${y}px`);
  }

  function resetPointer() {
    stage.current?.style.setProperty("--pointer-x", "0px");
    stage.current?.style.setProperty("--pointer-y", "0px");
  }

  return (
    <div className={`command-center${paused ? " motion-paused" : ""}`}>
      <div className="command-topline">
        <span><i className="status-dot" /> AGENT ORCHESTRATION</span>
        <span>SYS.01 / SECURE</span>
      </div>

      <div className="core-stage" ref={stage} onPointerMove={movePointer} onPointerLeave={resetPointer}>
        <div className="core-parallax">
          <div className="core-coordinate coordinate-north">N / 00.00°</div>
          <div className="core-coordinate coordinate-east">90°</div>
          <div className="core-coordinate coordinate-west">270°</div>
          <RadialGeometry className="core-geometry" />
          <svg className="core-network" viewBox="0 0 600 600" fill="none" aria-hidden="true">
            <path className="mesh-line" d="M300 71 499 185 499 415 300 529 101 415 101 185Z M101 185 499 415M499 185 101 415M300 71v458M101 185h398M101 415h398" />
            <g className="packet-lines">
              <path d="M101 185 300 300 499 415" />
              <path d="M499 185 300 300 101 415" />
              <path d="M300 71v458" />
            </g>
            {HEX_NODES.map((node) => (
              <g key={node} transform={`rotate(${node * 60} 300 300)`}>
                <circle cx="300" cy="71" r="4" />
                <path d="M292 71h-14m44 0h-14" />
              </g>
            ))}
          </svg>
          <div className="hud-ring hud-ring-outer" />
          <div className="hud-ring hud-ring-ticks" />
          <div className="hud-ring hud-ring-inner" />
          <div className="radar-sweep" />
          <div className="scan-wave wave-one" />
          <div className="scan-wave wave-two" />
          <div className="data-orbit data-orbit-one"><i /></div>
          <div className="data-orbit data-orbit-two"><i /></div>

          <div className="ai-core">
            <span className="core-top-label">HUMAN-GOVERNED</span>
            <div className="core-emblem"><AgentIcon kind="manager" /></div>
            <strong>AI SECURITY<br />CORE</strong>
            <span className="core-online"><i className="status-dot" /> ALL SYSTEMS ALIGNED</span>
            <span className="core-id">NMRK / INTELLIGENCE ENGINE</span>
          </div>

          {agents.map((agent, index) => (
            <div className={`agent-orbit orbit-${index}`} key={agent.kind}>
              <div className="orbit-anchor">
                <button
                  type="button"
                  className={`orbit-module module-${agent.kind}${selected === agent.kind ? " is-selected" : ""}`}
                  onClick={() => setSelected(agent.kind)}
                  aria-pressed={selected === agent.kind}
                  aria-label={`Inspect ${agent.name} agent`}
                >
                  <span className="orbit-module-top"><span>{agent.number} / AGENT</span><i /></span>
                  <span className="orbit-module-main"><AgentIcon kind={agent.kind} /><strong>{agent.name}</strong></span>
                  <span className="orbit-module-status">{MODULE_STATUS[agent.kind]}</span>
                </button>
              </div>
            </div>
          ))}

          <div className="floating-panel panel-monitor">
            <span className="panel-icon"><FeatureIcon name="targets" /></span>
            <div>
              <small>PERIMETER STATUS</small>
              <strong>Threat Monitoring Active</strong>
              <span className="mini-bars"><Indices count={12} /></span>
            </div>
            <i className="status-dot" />
          </div>
          <div className="floating-panel panel-verification">
            <span className="panel-icon"><FeatureIcon name="verify" /></span>
            <div>
              <small>EVIDENCE ENGINE</small>
              <strong>Verification Running</strong>
              <span className="panel-progress"><i /></span>
            </div>
          </div>
          <div className="floating-panel panel-audit">
            <span className="panel-icon"><FeatureIcon name="audit" /></span>
            <div>
              <small>EVERY ACTION. ACCOUNTED FOR.</small>
              <strong>Audit Trail Enabled</strong>
            </div>
            <i className="status-dot" />
          </div>
          <div className="authorization-pill"><FeatureIcon name="compliance" /> Authorization Confirmed <span>HUMAN APPROVED</span></div>
          <div className="core-particles" aria-hidden="true"><Indices count={16} /></div>
        </div>
      </div>

      <div className="command-readout" aria-live="polite">
        <span className="readout-icon"><AgentIcon kind={selected} /></span>
        <div>
          <strong>{active ? `${active.name} Agent` : "Intelligence, orchestrated."}</strong>
          <span>{active ? active.detail : "Four specialists. One mission. Your control."}</span>
        </div>
        <button type="button" className="core-reset" onClick={() => setSelected("manager")} aria-label="Reset agent selection"><ArrowIcon /></button>
      </div>

      <div className="command-bottomline">
        <span><i className="status-dot" /> ILLUSTRATIVE SYSTEM PREVIEW</span>
        <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>
          {paused ? "RESUME MOTION" : "PAUSE MOTION"}
          <svg viewBox="0 0 12 12" aria-hidden="true">
            {paused ? <path d="m3 2 7 4-7 4Z" fill="currentColor" /> : <path d="M4 2v8m4-8v8" stroke="currentColor" strokeWidth="2" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
