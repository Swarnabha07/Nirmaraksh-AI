import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";
import { AgentIcon, ArrowIcon, FeatureIcon } from "@/components/ui/Icons";
import { problems } from "@/data/sections";
import { site } from "@/data/site";

export default function ProblemSection() {
  return (
    <section className="content-section problem-section page-container" id="problem" aria-labelledby="problem-title">
      <SectionIntro
        eyebrow="01 / THE PROBLEM"
        titleId="problem-title"
        title={<>Security Testing<br />Is <GradientText>Fragmented.</GradientText></>}
        description="More tools should mean more clarity. Instead, security teams are left stitching together disconnected signals and doing the heavy lifting by hand."
      />
      <div className="problem-grid">
        {problems.map((problem) => (
          <article className="problem-card" key={problem.number}>
            <div className="problem-card-top">
              <span className="section-card-icon"><FeatureIcon name={problem.icon} /></span>
              <span className="card-index">/ {problem.number}</span>
            </div>
            <div className="problem-card-graphic"><span /><span /><span /></div>
            <div className="problem-card-bottom">
              <span className="card-kicker">{problem.tag}</span>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="transformation" aria-label={`${site.name} turns disconnected tools into one unified security workflow`}>
        <div className="transformation-before">
          <span className="transform-label">THE OLD WAY</span>
          <div className="loose-tools"><span>Recon</span><span>Findings</span><span>Validation</span></div>
          <strong>Disconnected tools</strong>
        </div>
        <div className="transformation-arrow"><span><ArrowIcon /></span></div>
        <div className="transformation-after">
          <div className="transform-after-head">
            <span className="transform-label">{`THE ${site.name.toUpperCase()} WAY`}</span>
            <AgentIcon kind="manager" />
          </div>
          <div className="unified-track"><span>Discover</span><i /><span>Analyze</span><i /><span>Verify</span><i /><span>Report</span></div>
          <strong>One unified workflow <ArrowIcon diagonal /></strong>
        </div>
      </div>
    </section>
  );
}
