import Header from "@/components/layout/Header";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import WorkspaceSection from "@/components/landing/WorkspaceSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import AccessControlSection from "@/components/landing/AccessControlSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import TrustSection from "@/components/landing/TrustSection";
import ControlSection from "@/components/landing/ControlSection";
import DemoSection from "@/components/landing/DemoSection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <WorkspaceSection />
        <ArchitectureSection />
        {/* <AccessControlSection /> */}
        <WorkflowSection />
        <TrustSection />
        <ControlSection />
        <DemoSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
