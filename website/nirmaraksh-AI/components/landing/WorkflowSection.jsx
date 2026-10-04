import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";
import { FeatureIcon } from "@/components/ui/Icons";
import { workflow } from "@/data/sections";
import { site } from "@/data/site";

export default function WorkflowSection() {
  return (
    <section className="content-section workflow-section" id="platform" aria-labelledby="workflow-title">
      <div className="page-container">
        <SectionIntro
          eyebrow="02 / THE WORKFLOW"
          titleId="workflow-title"
          title={<>{`How ${site.name}`}<br /><GradientText>Works.</GradientText></>}
          description="From the first signal to the final finding, every phase moves together in a continuous, transparent workflow."
        />
        <div className="workflow-grid">
          {workflow.map((phase) => (
            <article className="workflow-card" key={phase.number}>
              <div className="workflow-connector" aria-hidden="true"><span /></div>
              <div className="workflow-card-top">
                <span className="workflow-icon"><FeatureIcon name={phase.icon} /></span>
                <span className="card-index">{phase.number} / 05</span>
              </div>
              <div><h3>{phase.title}</h3><p>{phase.description}</p></div>
            </article>
          ))}
        </div>
        <div className="workflow-footnote">
          <span className="live-dot" /> ONE CONNECTED MISSION <span className="footnote-rule" /> HUMAN OVERSIGHT AT EVERY STEP
        </div>
      </div>
    </section>
  );
}
