import DemoButton from "@/components/ui/DemoButton";
import Eyebrow from "@/components/ui/Eyebrow";
import { GradientText } from "@/components/ui/SectionIntro";
import { AgentIcon, ArrowIcon, PlayIcon } from "@/components/ui/Icons";
import { site } from "@/data/site";

const SATELLITES = [
  { kind: "recon", position: "scene-one" },
  { kind: "analysis", position: "scene-two" },
  { kind: "verification", position: "scene-three" },
  { kind: "reporting", position: "scene-four" },
];

export default function DemoSection() {
  return (
    <section className="content-section demo-section page-container" id="demo" aria-labelledby="demo-section-title">
      <div className="demo-section-copy">
        <Eyebrow>07 / SEE IT IN ACTION</Eyebrow>
        <h2 id="demo-section-title">Security work,<br /><GradientText>reimagined.</GradientText></h2>
        <p>See how coordinated agents take a mission from discovery to verified findings—with your team in control throughout.</p>
        <DemoButton className="demo-text-link">Explore the interactive walkthrough <ArrowIcon diagonal /></DemoButton>
      </div>
      <DemoButton className="demo-player" aria-label="Open interactive product walkthrough">
        <span className="demo-player-top">
          <span><span className="live-dot" />{` ${site.name.toUpperCase()} / PRODUCT WALKTHROUGH`}</span>
          <span>PREVIEW 01</span>
        </span>
        <span className="demo-player-scene">
          <span className="scene-orbit">
            <span className="scene-core"><AgentIcon kind="manager" /></span>
            {SATELLITES.map(({ kind, position }) => (
              <span className={`scene-satellite ${position}`} key={kind}><AgentIcon kind={kind} /></span>
            ))}
          </span>
          <span className="demo-play"><PlayIcon /></span>
        </span>
        <span className="demo-player-bottom">
          <span>THE AGENTIC SECURITY WORKSPACE</span>
          <span className="player-timeline"><i /></span>
          <span>GUIDED PREVIEW <ArrowIcon diagonal /></span>
        </span>
      </DemoButton>
    </section>
  );
}
