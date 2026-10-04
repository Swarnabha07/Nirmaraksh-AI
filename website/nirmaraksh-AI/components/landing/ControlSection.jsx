import DemoButton from "@/components/ui/DemoButton";
import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";
import { AgentIcon, ArrowIcon, FeatureIcon } from "@/components/ui/Icons";
import { controls } from "@/data/sections";
import { site } from "@/data/site";

export default function ControlSection() {
  return (
    <section className="content-section control-section" id="control" aria-labelledby="control-title">
      <div className="page-container">
        <SectionIntro
          eyebrow="06 / BUILT FOR TRUST"
          titleId="control-title"
          title={<>Human Controlled<br /><GradientText>Security.</GradientText></>}
          description="Autonomous doesn't mean unchecked. Your team sets the boundaries, approves the actions, and has the evidence to back every decision."
        />
        <div className="control-grid">
          {controls.map((control) => (
            <article className="control-card" key={control.number}>
              <div className="control-card-top">
                <span className="control-icon"><FeatureIcon name={control.icon} /></span>
                <span className="card-index">{control.number} / 04</span>
              </div>
              <div><h3>{control.title}</h3><p>{control.description}</p></div>
              <span className="control-corner" aria-hidden="true">+</span>
            </article>
          ))}
        </div>
        <div className="closing-line">
          <div><AgentIcon kind="manager" /><span>Powerful agents. <strong>Your rules.</strong></span></div>
          <DemoButton>{`See ${site.name} in action `}<ArrowIcon diagonal /></DemoButton>
        </div>
      </div>
    </section>
  );
}
