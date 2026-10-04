import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthButton from "@/components/auth/AuthButton";
import DownloadPlatforms from "@/components/download/DownloadPlatforms";
import Eyebrow from "@/components/ui/Eyebrow";
import { ArrowIcon, CheckIcon } from "@/components/ui/Icons";
import { heroTrustPoints } from "@/data/sections";
import s from "./download.module.css";

export const metadata = {
  title: "Download — Nirmaraksh AI",
  description: "Get the Nirmaraksh desktop app for Windows, macOS and Linux.",
};

function DesktopCore() {
  return (
    <div className={s.coreWrap} aria-hidden="true">
      <div className={`${s.orbit} ${s.orbitOne}`}>
        <i />
        <i />
        <i />
      </div>
      <div className={`${s.orbit} ${s.orbitTwo}`}>
        <i />
        <i />
      </div>
      <div className={`${s.orbit} ${s.orbitThree}`} />
      <div className={s.radar} />
      <div className={s.coreGlow} />
      <div className={s.core}>
        <div className={s.coreGrid} />
        <div className={s.coreMark}>N</div>
        <strong>NIRMARAKSH</strong>
        <small>DESKTOP APP</small>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <div className={s.page}>
      <Header />
      <main>
        <section className={s.heroSection} aria-labelledby="download-title">
          <div className={s.heroEnv} aria-hidden="true">
            <div className={s.cyberGrid} />
            <div className={s.particles}>
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          </div>

          <div className={`${s.hero} page-container`}>
            <div className={s.heroCopy}>
              <Eyebrow>NIRMARAKSH DESKTOP</Eyebrow>
              <h1 id="download-title">
                Download <em>Nirmaraksh</em>
              </h1>
              <p>
                Deploy intelligent multi-agent security operations with complete
                human oversight.
              </p>
              <div className={s.heroActions}>
                <a className="button-primary" href="#downloads">
                  Download Now <ArrowIcon diagonal />
                </a>
                <AuthButton className="button-secondary">
                  Try the web chat <ArrowIcon diagonal />
                </AuthButton>
              </div>
              <ul className={s.heroProof}>
                {heroTrustPoints.map((label) => (
                  <li key={label}>
                    <CheckIcon />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <DesktopCore />
          </div>
        </section>

        <section
          className={s.downloads}
          id="downloads"
          aria-labelledby="downloads-title"
        >
          <div className="page-container">
            <div className={s.sectionHead}>
              <Eyebrow>NATIVE APPLICATIONS</Eyebrow>
              <h2 id="downloads-title">Built for your environment.</h2>
              <p>Choose your platform and get the Nirmaraksh desktop app.</p>
            </div>
            <DownloadPlatforms />
          </div>
        </section>

        <section className={s.cta} aria-labelledby="download-cta-title">
          <div className={s.ctaRings} aria-hidden="true" />
          <div className={s.ctaContent}>
            <Eyebrow>READY TO DEPLOY</Eyebrow>
            <h2 id="download-cta-title">
              Ready to secure <em>smarter?</em>
            </h2>
            <p>
              Download Nirmaraksh and deploy intelligent security operations
              today.
            </p>
            <div className={`${s.heroActions} ${s.ctaActions}`}>
              <a className="button-primary" href="#downloads">
                Download Nirmaraksh <ArrowIcon diagonal />
              </a>
              <AuthButton className="button-secondary">
                Try the web chat <ArrowIcon diagonal />
              </AuthButton>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
