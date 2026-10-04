import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import Eyebrow from "@/components/ui/Eyebrow";
import { GradientText } from "@/components/ui/SectionIntro";
import { ArrowIcon } from "@/components/ui/Icons";

export default function FinalCta() {
  return (
    <section className="final-cta page-container" aria-labelledby="final-title">
      <div className="final-cta-glow" />
      <div className="final-cta-content">
        <Eyebrow>A MORE INTELLIGENT WAY FORWARD</Eyebrow>
        <h2 id="final-title">
          Your security team.
          <br />
          <GradientText>A new advantage.</GradientText>
        </h2>
        <p>
          Bring autonomous execution and human judgment together in one
          workspace.
        </p>
        <div className="final-actions">
          <AuthButton className="button-primary">
            Explore the product <ArrowIcon diagonal />
          </AuthButton>
          <Link href="/download" className="button-secondary">
            Download the app <ArrowIcon diagonal />
          </Link>
        </div>
      </div>
    </section>
  );
}
