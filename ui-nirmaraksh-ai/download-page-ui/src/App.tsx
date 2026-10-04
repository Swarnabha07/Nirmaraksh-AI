import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

function ArrowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h13M14 7l5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Icon>
  );
}

function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 6v5.2c0 4.5 3.1 8.2 7.5 9.8 4.4-1.6 7.5-5.3 7.5-9.8V6L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

function WindowsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m3.5 5.3 7-1v7h-7v-6Zm8.2-1.2 8.8-1.3v8.5h-8.8V4.1ZM3.5 12.7h7v7l-7-1v-6Zm8.2 0h8.8v8.5l-8.8-1.3v-7.2Z" fill="currentColor" />
    </Icon>
  );
}

function AppleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.9 12.6c0-2.5 2-3.7 2.1-3.8a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.7.9-.8 0-2-1-3.2-.9a4.8 4.8 0 0 0-4 2.4c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.9-1.1-2.9-3.6ZM14.4 5.3c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1 0 2.3-.6 3-1.5Z" fill="currentColor" />
    </Icon>
  );
}

function LinuxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5c-3 0-4 2.8-3.8 5.2-1.9 1.5-3.2 4.6-3.4 7.3-.1 1.8.7 2.8 2 2.8.6 2.4 2.5 3.7 5.2 3.7s4.6-1.3 5.2-3.7c1.3 0 2.1-1 2-2.8-.2-2.7-1.5-5.8-3.4-7.3.2-2.4-.8-5.2-3.8-5.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M9.6 8.3h.1m4.6 0h.1M10 11.3c1.3.8 2.7.8 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M8.2 17.5c2.5-1 5.1-1 7.6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </Icon>
  );
}

function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 7 8 5-8 5V7Z" fill="currentColor" />
    </Icon>
  );
}

const platforms = [
  {
    name: "Windows",
    subtitle: "Windows 10 & 11",
    details: ["64-bit Architecture", "Recommended Platform", "Latest Stable Build"],
    icon: WindowsIcon,
    meta: "EXE · 148 MB",
  },
  {
    name: "macOS",
    subtitle: "Apple Silicon & Intel",
    details: ["macOS 13+", "Optimized Performance", "Secure Deployment"],
    icon: AppleIcon,
    meta: "DMG · 162 MB",
  },
  {
    name: "Linux",
    subtitle: "Ubuntu, Debian, Arch",
    details: ["Native Linux Support", "CLI Integration", "Developer Friendly"],
    icon: LinuxIcon,
    meta: "APPIMAGE · 136 MB",
  },
];

const plans = [
  {
    name: "Community",
    price: "Free",
    description: "For individual security researchers",
    features: ["Multi-Agent Workspace", "Recon Agent", "Analysis Agent", "Basic Reporting", "Local Deployment"],
    action: "Download Free",
  },
  {
    name: "Professional",
    price: "₹999",
    suffix: "/month",
    description: "For modern security teams",
    features: ["Everything in Community", "Verification Agent", "Team Collaboration", "Advanced Reporting", "Priority Updates"],
    action: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations at scale",
    features: ["Unlimited Agents", "RBAC", "SSO", "Compliance Features", "Dedicated Support"],
    action: "Contact Sales",
  },
];

const trustItems = [
  ["01", "Verified Publisher", "Identity validated release"],
  ["02", "Digitally Signed", "Authentic production build"],
  ["03", "Security Audited", "Independent assessment"],
  ["04", "SHA256 Available", "Verify file integrity"],
];

function Button({
  children,
  secondary = false,
  href = "#downloads",
}: {
  children: ReactNode;
  secondary?: boolean;
  href?: string;
}) {
  return (
    <a className={`button ${secondary ? "button-secondary" : ""}`} href={href}>
      <span>{children}</span>
      {secondary ? <ArrowIcon /> : <DownloadIcon />}
    </a>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="section-heading">
      <div className="eyebrow"><span />{eyebrow}</div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function CyberCore() {
  return (
    <div className="core-wrap" aria-label="Nirmaraksh version 1.0.0 ready for deployment">
      <div className="orbit orbit-one"><i /><i /><i /></div>
      <div className="orbit orbit-two"><i /><i /></div>
      <div className="orbit orbit-three" />
      <div className="radar" />
      <div className="core-glow" />
      <div className="core">
        <div className="core-grid" />
        <div className="core-mark">N</div>
        <strong>NIRMARAKSH</strong>
        <span className="ready"><i /> READY FOR DEPLOYMENT</span>
        <small>VERSION 1.0.0</small>
      </div>
      <div className="telemetry telemetry-a"><span>SYSTEM STATUS</span><b>OPERATIONAL</b></div>
      <div className="telemetry telemetry-b"><span>THREAT ENGINE</span><b>ACTIVE</b></div>
      <div className="telemetry telemetry-c"><span>CORE INTEGRITY</span><b>100%</b></div>
      <div className="telemetry telemetry-d"><span>AGENT NETWORK</span><b>ONLINE</b></div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard" aria-hidden="true">
      <div className="dash-top">
        <div className="dash-brand"><span>N</span> NIRMARAKSH / SECURITY OPS</div>
        <div className="dash-live"><i /> LIVE MONITORING</div>
      </div>
      <div className="dash-body">
        <div className="dash-nav">
          {["Overview", "Agents", "Intelligence", "Reports", "Workspace"].map((item, index) => (
            <div className={index === 0 ? "active" : ""} key={item}><i />{item}</div>
          ))}
        </div>
        <div className="dash-content">
          <div className="dash-title"><span>Security operations overview</span><b>Last 24 hours</b></div>
          <div className="metric-row">
            <div><small>ACTIVE AGENTS</small><strong>06</strong><em>All systems nominal</em></div>
            <div><small>ASSETS MONITORED</small><strong>1,284</strong><em>+12 today</em></div>
            <div><small>THREATS ANALYZED</small><strong>3,921</strong><em>99.8% resolved</em></div>
          </div>
          <div className="dash-panels">
            <div className="network-map">
              <small>AGENT NETWORK</small>
              <div className="map-core">AI</div>
              {[0, 1, 2, 3, 4, 5].map((node) => <i className={`map-node node-${node}`} key={node} />)}
            </div>
            <div className="activity">
              <small>LIVE ACTIVITY</small>
              {["Recon scan completed", "Asset graph updated", "Verification passed", "Report generated"].map((text, index) => (
                <div key={text}><i className={`activity-dot dot-${index}`} /><span>{text}</span><em>{index + 1}m</em></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <main>
      <nav className="navbar">
        <a className="brand" href="#top" aria-label="Nirmaraksh home">
          <img src="/nirmaraksh-logo.png" alt="Nirmaraksh" />
          <span>NIRMARAKSH</span>
        </a>
        <div className="nav-links">
          <a href="#downloads">Downloads</a>
          <a href="#pricing">Pricing</a>
          <a href="#demo">Demo</a>
          <a href="#trust">Security</a>
        </div>
        <a className="nav-docs" href="#demo">Documentation <ArrowIcon /></a>
      </nav>

      <section className="hero" id="top">
        <div className="cyber-grid" />
        <div className="particles">
          {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
        </div>
        <div className="hero-copy">
          <div className="eyebrow"><span />NIRMARAKSH DESKTOP</div>
          <h1>Download <em>Nirmaraksh</em></h1>
          <p>Deploy intelligent multi-agent security operations with complete human oversight.</p>
          <div className="hero-actions">
            <Button>Download Now</Button>
            <Button secondary href="#demo">View Documentation</Button>
          </div>
          <div className="hero-proof">
            <div><ShieldIcon /><span><b>VERIFIED RELEASE</b>Digitally signed & secure</span></div>
            <div className="proof-line" />
            <div><span><b>v1.0.0</b>Latest stable build</span></div>
          </div>
        </div>
        <CyberCore />
        <div className="scroll-cue"><span>EXPLORE DOWNLOADS</span><i /></div>
      </section>

      <section className="section downloads-section" id="downloads">
        <SectionHeading
          eyebrow="NATIVE APPLICATIONS"
          title="Built for your environment."
          body="Choose your platform. Every release is hardened, signed, and engineered for uncompromising performance."
        />
        <div className="platform-grid">
          {platforms.map(({ name, subtitle, details, icon: PlatformIcon, meta }) => (
            <article className="platform-card" key={name}>
              <div className="card-scan" />
              <div className="platform-top">
                <div className="platform-icon"><PlatformIcon /></div>
                <div className="platform-status"><i /> AVAILABLE</div>
              </div>
              <h3>{name}</h3>
              <p>{subtitle}</p>
              <ul>
                {details.map((detail) => <li key={detail}><CheckIcon />{detail}</li>)}
              </ul>
              <a className="download-link" href="#final-cta">
                <span>Download for {name}<small>{meta}</small></span><DownloadIcon />
              </a>
            </article>
          ))}
        </div>
        <p className="system-note"><ShieldIcon /> All installers are digitally signed and verified by Nirmaraksh Security Labs.</p>
      </section>

      <section className="section pricing-section" id="pricing">
        <SectionHeading eyebrow="FLEXIBLE DEPLOYMENT" title="Choose your deployment." body="Start securing smarter today. Scale when your mission demands it." />
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.popular ? "popular" : ""}`} key={plan.name}>
              {plan.popular && <div className="popular-badge">MOST POPULAR</div>}
              <span className="plan-index">0{plans.indexOf(plan) + 1}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="price">{plan.price}<small>{plan.suffix}</small></div>
              <div className="price-divider" />
              <ul>
                {plan.features.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}
              </ul>
              <a className={`plan-button ${plan.popular ? "primary" : ""}`} href={plan.name === "Enterprise" ? "mailto:sales@nirmaraksh.com" : "#downloads"}>
                {plan.action}<ArrowIcon />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section demo-section" id="demo">
        <div className="demo-card">
          <div className="demo-copy">
            <div className="eyebrow"><span />INTERACTIVE PREVIEW</div>
            <h2>Experience Nirmaraksh<br />before installation.</h2>
            <p>Explore the agentic security workspace through a guided interactive demo. No setup. No commitment.</p>
            <div className="demo-actions">
              <Button href="#top">Launch Interactive Demo</Button>
              <a className="watch-link" href="#top"><span><PlayIcon /></span>Watch Product Walkthrough</a>
            </div>
            <div className="demo-meta"><i /> SECURE SANDBOX ENVIRONMENT <b>•</b> 5 MIN GUIDED TOUR</div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="section trust-section" id="trust">
        <SectionHeading eyebrow="TRUSTED BY DESIGN" title="Security you can verify." body="Every Nirmaraksh release is built, audited, and delivered with enterprise-grade integrity." />
        <div className="trust-grid">
          {trustItems.map(([number, title, description]) => (
            <div className="trust-item" key={title}>
              <span className="trust-number">{number}</span>
              <div className="trust-icon"><ShieldIcon /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="verified"><CheckIcon /> VERIFIED</div>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta" id="final-cta">
        <div className="cta-rings" />
        <div className="eyebrow"><span />READY TO DEPLOY</div>
        <h2>Ready to secure <em>smarter?</em></h2>
        <p>Download Nirmaraksh and deploy intelligent security operations today.</p>
        <div className="hero-actions">
          <Button>Download Nirmaraksh</Button>
          <Button secondary href="#demo">Launch Demo</Button>
        </div>
      </section>

      <footer>
        <span>NIRMARAKSH</span>
        <p>THE AGENTIC SECURITY WORKSPACE</p>
        <small>© 2025 Nirmaraksh Security Labs. All systems monitored.</small>
      </footer>
    </main>
  );
}
