import NetworkVisual from "@/components/landing/NetworkVisual";
import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";
import { AgentIcon, ArrowIcon } from "@/components/ui/Icons";
import { agents } from "@/data/agents";

export default function ArchitectureSection() {
  return (
    <section className="content-section architecture-section page-container" id="agents" aria-labelledby="architecture-title">
      <SectionIntro
        className="architecture-intro"
        eyebrow="03 / THE ARCHITECTURE"
        titleId="architecture-title"
        title={<>Intelligence,<br /><GradientText>Orchestrated.</GradientText></>}
        description="One manager. Four specialized agents. A coordinated system designed to turn complex security testing into clear, actionable outcomes."
      />
      <div className="architecture-layout">
        <div className="architecture-visual"><NetworkVisual idPrefix="architecture" /></div>
        <div className="architecture-aside">
          <div className="aside-header"><span className="live-dot" /> SYSTEM OVERVIEW <span>05 / 05</span></div>
          <div className="aside-main">
            <div className="aside-brand"><AgentIcon kind="manager" /></div>
            <span className="card-kicker">CENTRAL INTELLIGENCE</span>
            <h3>One mission.<br />Five minds.</h3>
            <p>The Manager Agent directs each specialist, carries context between stages, and keeps people in control of the process.</p>
          </div>
          <div className="aside-list">
            {agents.map((agent) => <span key={agent.kind}><i />{` ${agent.number} — ${agent.name.toUpperCase()}`}</span>)}
          </div>
          <div className="aside-footer">COORDINATED BY THE MANAGER AGENT <ArrowIcon diagonal /></div>
        </div>
      </div>
      <div className="architecture-caption">
        <span>FIG. 02 / MULTI-AGENT ARCHITECTURE</span>
        <span>CONNECTED BY DESIGN. CONTROLLED BY YOU.</span>
      </div>
    </section>
  );
}
