import AuthFlow from "@/components/landing/AuthFlow";
import SectionIntro, { GradientText } from "@/components/ui/SectionIntro";

export default function AccessControlSection() {
  return (
    <section className="content-section auth-section page-container" id="auth-flow" aria-labelledby="auth-title">
      <SectionIntro
        eyebrow="05 / ACCESS CONTROL"
        titleId="auth-title"
        title={<>Every access decision.<br /><GradientText>Accounted for.</GradientText></>}
        description="Explore how a two-factor sign-in moves through identity checks, human approval, and a complete audit trail—with clear exits when a check fails."
      />
      <AuthFlow />
      <div className="architecture-caption">
        <span>FIG. 03 / INTERACTIVE 2FA DECISION FLOW</span>
        <span>SELECT A PATH TO EXPLORE THE OUTCOME.</span>
      </div>
    </section>
  );
}
