import { AgentIcon } from "@/components/ui/Icons";
import { agents } from "@/data/agents";

const AGENT_POSITIONS = {
  recon: { x: 18, y: 8 },
  analysis: { x: 18, y: 32 },
  verification: { x: 18, y: 56 },
  reporting: { x: 18, y: 80 },

  coding: { x: 82, y: 8 },
  development: { x: 82, y: 32 },
  flight: { x: 82, y: 56 },
  system: { x: 82, y: 80 },
};

const CONNECTIONS = [
  { d: "M310 155 C270 145 225 95 184 72", flow: "flow-line" },
  { d: "M310 205 C270 200 225 180 184 190", flow: "flow-line flow-delay-1" },
  { d: "M310 270 C270 280 225 310 184 310", flow: "flow-line flow-delay-2" },
  { d: "M310 320 C270 335 225 390 184 428", flow: "flow-line flow-delay-3" },

  { d: "M370 155 C410 145 455 95 496 72", flow: "flow-line flow-delay-1" },
  { d: "M370 205 C410 200 455 180 496 190", flow: "flow-line flow-delay-2" },
  { d: "M370 270 C410 280 455 310 496 310", flow: "flow-line flow-delay-3" },
  { d: "M370 320 C410 335 455 390 496 428", flow: "flow-line" },
];

const JUNCTIONS = [
  [265, 120],
  [265, 195],
  [265, 315],
  [265, 390],
  [415, 120],
  [415, 195],
  [415, 315],
  [415, 390],
];

export default function NetworkVisual({ idPrefix = "hero" }) {
  const gradient = `${idPrefix}-lineGradient`;
  const glow = `${idPrefix}-lineGlow`;

  return (
    <div
      className="network-frame"
      aria-label="Manager Agent coordinates Recon, Analysis, Verification, Reporting, Coding, Development, Flight Finder, and System Tasks agents"
    >
      <div className="network-grid" />

      <div className="network-head">
        <span className="network-head-label">
          <span className="live-dot" /> LIVE ORCHESTRATION
        </span>

        <span className="network-head-right">
          NIRMARAKSH / 001 <span className="head-cross">+</span>
        </span>
      </div>

      <div className="network-stage">
        <div className="ambient-orbit orbit-one" />
        <div className="ambient-orbit orbit-two" />

        <svg
          className="connections"
          viewBox="0 0 680 500"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={gradient}
              x1="130"
              y1="80"
              x2="550"
              y2="420"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4c99a8" stopOpacity=".3" />
              <stop offset=".48" stopColor="#8becff" stopOpacity=".9" />
              <stop offset="1" stopColor="#45B7C9" stopOpacity=".45" />
            </linearGradient>

            <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          {/* Soft glowing connection layer */}
          <g
            stroke={`url(#${gradient})`}
            strokeWidth="2"
            filter={`url(#${glow})`}
            opacity=".7"
          >
            {CONNECTIONS.map(({ d }) => (
              <path key={d} d={d} />
            ))}
          </g>

          {/* Sharp animated connection layer */}
          <g
            stroke={`url(#${gradient})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {CONNECTIONS.map(({ d, flow }) => (
              <path key={d} className={flow} d={d} />
            ))}
          </g>

          {/* Connection junctions */}
          <g fill="#a7f0ff">
            {JUNCTIONS.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" />
            ))}
          </g>
        </svg>

        {agents.map((agent) => {
          const position = AGENT_POSITIONS[agent.kind];

          return (
            <div
              className={`agent-card agent-${agent.kind}`}
              key={agent.kind}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
            >
              <span className="agent-icon">
                <AgentIcon kind={agent.kind} />
              </span>

              <span className="agent-copy">
                <strong>{agent.name}</strong>
                <span>{agent.detail}</span>
              </span>

              <span className="agent-number">{agent.number}</span>
            </div>
          );
        })}

        <div className="manager-card">
          <div className="manager-halo" />

          <div className="manager-icon">
            <AgentIcon kind="manager" />
          </div>

          <span className="manager-label">THE ORCHESTRATOR</span>

          <strong>Manager Agent</strong>

          <span className="manager-status">
            <span /> Coordinating agents
          </span>
        </div>
      </div>

      <div className="network-footer">
        <span>
          <span className="footer-signal" /> SYSTEM OPERATIONAL
        </span>

        <span>
          HUMAN IN THE LOOP <span className="footer-slash">/</span> ALWAYS
        </span>
      </div>
    </div>
  );
}
