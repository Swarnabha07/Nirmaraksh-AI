import WorkspacePreview from "@/components/landing/WorkspacePreview";
import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";
import { site } from "@/data/site";

export default function WorkspaceSection() {
  return (
    <section className="content-section workspace-section" id="workspace" aria-labelledby="workspace-title">
      <div className="page-container">
        <SectionIntro
          eyebrow="02 / THE WORKSPACE"
          titleId="workspace-title"
          title={<>Everything in view.<br /><GradientText>Nothing in silos.</GradientText></>}
          description="Agents, findings, reports, and every decision live together in one focused command center. Explore the sample workspace below."
        />
        <WorkspacePreview />
        <div className="architecture-caption">
          <span>{`FIG. 04 / ${site.name.toUpperCase()} WORKSPACE PREVIEW`}</span>
          <span>ILLUSTRATIVE DEMO DATA · NOT A LIVE SCAN</span>
        </div>
      </div>
    </section>
  );
}
