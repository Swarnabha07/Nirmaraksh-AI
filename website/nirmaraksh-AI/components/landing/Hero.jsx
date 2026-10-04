import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import SecurityCore from "@/components/landing/SecurityCore";
import DemoButton from "@/components/ui/DemoButton";
import {
  ArrowIcon,
  CheckIcon,
  FeatureIcon,
  PlayIcon,
  RadialGeometry,
} from "@/components/ui/Icons";
import { heroTrustPoints } from "@/data/sections";
import { site } from "@/data/site";

function HeroEnvironment() {
  return (
    <div className="hero-environment" aria-hidden="true">
      <div className="hero-cyber-grid" />
      <div className="hero-hex-mesh" />
      <RadialGeometry className="background-geometry" />
      <svg className="background-circuits" viewBox="0 0 1440 800" fill="none">
        <path d="M0 140h140l80 80h130M0 570h90l70-70h170M1440 150h-110l-75 75h-160M1440 630h-100l-95-95h-120M480 0v70l50 50v80M1000 800v-70l-60-60v-80" />
        <circle cx="350" cy="220" r="4" />
        <circle cx="330" cy="500" r="4" />
        <circle cx="1095" cy="225" r="4" />
      </svg>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      className="hero cinematic-hero page-container"
      aria-labelledby="hero-title"
    >
      <HeroEnvironment />

      <div className="hero-copy">
        <div className="hero-badge">
          <span className="badge-symbol">
            <FeatureIcon name="compliance" />
          </span>
          <span>Human-Controlled Agentic Security</span>
          <i className="status-dot" />
        </div>

        <div className="hero-title-decoration" aria-hidden="true">
          <span />
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="10" />
            <circle cx="16" cy="16" r="4" />
            <path d="M16 0v6m0 20v6M0 16h6m20 0h6" />
          </svg>
          <span />
          <small>INTELLIGENCE WITH INTENTION</small>
        </div>

        <h1 id="hero-title">
          {site.name}
          <span className="headline-glyph" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" />
              <path d="M16 0v8m0 16v8M0 16h8m16 0h8" />
              <circle cx="16" cy="16" r="3" />
            </svg>
          </span>
        </h1>

        <p className="hero-brand-subtitle">nirman . raksha . vivek</p>

        <p className="hero-subheadline">
          The Agentic <br />
          <span>Security Workspace</span>
        </p>

        <p className="hero-description">
          Coordinate autonomous security agents across reconnaissance, analysis,
          verification, and reporting while maintaining complete human
          oversight, authorization controls, and auditability.
        </p>

        <div className="hero-actions">
          <AuthButton className="button-primary">
            Get Started <ArrowIcon diagonal />
          </AuthButton>

          <Link href="/download" className="button-secondary">
            Download the app <ArrowIcon diagonal />
          </Link>

          <DemoButton className="button-secondary">
            <span className="play-icon">
              <PlayIcon />
            </span>
            Watch Demo
          </DemoButton>
        </div>

        <div className="hero-trust">
          {heroTrustPoints.map((label) => (
            <span key={label}>
              <CheckIcon />
              {label}
            </span>
          ))}
        </div>

        <div className="hero-signature">
          <span className="signature-line" />
          <span>
            AUTONOMOUS BY DESIGN. <strong>ACCOUNTABLE BY DEFAULT.</strong>
          </span>
        </div>
      </div>

      <div className="hero-visual">
        <SecurityCore />
      </div>

      <div className="hero-bottom-strip">
        <span>
          <span className="status-dot" /> THE NEXT ERA OF SECURITY OPERATIONS
        </span>

        <a href="#platform">
          EXPLORE THE WORKSPACE <ArrowIcon />
        </a>

        <span>01 — INTELLIGENCE LAYER</span>
      </div>
    </section>
  );
}
