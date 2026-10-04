import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";
import { FeatureIcon } from "@/components/ui/Icons";
import { trustPrinciples } from "@/data/sections";
import { site } from "@/data/site";

export default function TrustSection() {
  return (
    <section className="content-section trust-section" id="trust" aria-labelledby="trust-title">
      <div className="page-container">
        <SectionIntro
          eyebrow="05 / TRUST BY DESIGN"
          titleId="trust-title"
          title={<>Built for confidence.<br /><GradientText>Not blind trust.</GradientText></>}
          description={`Powerful automation belongs inside clear boundaries. These are the principles that shape every ${site.name} workflow.`}
        />
        <div className="trust-grid">
          {trustPrinciples.map((principle) => (
            <article key={principle.index}>
              <span className="trust-icon"><FeatureIcon name={principle.icon} /></span>
              <span className="card-index">{principle.index}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
