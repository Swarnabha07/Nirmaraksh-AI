import Brand from "@/components/ui/Brand";
import DemoButton from "@/components/ui/DemoButton";
import DownloadOverviewButton from "@/components/ui/DownloadOverviewButton";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="page-container">
        <div className="footer-main">
          <div className="footer-brand-block">
            <Brand showLogo={false} />
            <p>Autonomous security testing.<br />Human oversight, always.</p>
            <span className="footer-brand-caption">THE AGENTIC SECURITY WORKSPACE</span>
          </div>
          <div className="footer-column">
            <h3>Explore</h3>
            <a href="/#problem">The challenge</a>
            <a href="/#platform">How it works</a>
            <a href="/#agents">Agent architecture</a>
            <a href="/#workspace">Workspace preview</a>
          </div>
          <div className="footer-column">
            <h3>Security</h3>
            <a href="/#control">Human control</a>
            <a href="/#auth-flow">2FA flow</a>
            <a href="/#trust">Trust by design</a>
          </div>
          <div className="footer-column">
            <h3>Get started</h3>
            <a href="/#demo">Product walkthrough</a>
            <DemoButton>Interactive demo</DemoButton>
            <DownloadOverviewButton>Download overview</DownloadOverviewButton>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()}{` ${site.name.toUpperCase()}. DESIGNED FOR THE NEXT ERA OF SECURITY.`}</span>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </div>
    </footer>
  );
}
