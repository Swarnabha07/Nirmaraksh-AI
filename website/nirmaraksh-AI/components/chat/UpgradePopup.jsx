import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestReleases } from "@/lib/api";
import { upgradeFeatures, upgradeIntro } from "@/data/chat";
import s from "./chat.module.css";
import { Icon } from "./ChatIcons";
import useModalBehavior from "./useModalBehavior";

// Desktop-app + upgrade popup opened from the + button. No payment code exists here.
export default function UpgradePopup({ onClose }) {
  const router = useRouter();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const [notice, setNotice] = useState("");
  const [releaseInfo, setReleaseInfo] = useState("");
  useModalBehavior({ containerRef: panelRef, initialFocusRef: closeRef, onClose });

  // Reuses the existing /api/releases/latest helper. A fallback (no real release rows) is shown as "not published yet".
  useEffect(() => {
    let active = true;
    getLatestReleases()
      .then((releases) => {
        if (!active || !releases?.length) return;
        if (releases.some((release) => release.isFallback)) setReleaseInfo("Installers haven't been published yet.");
        else setReleaseInfo(`Latest version ${releases[0].version}`);
      })
      .catch(() => {}); // release info is optional; stay quiet if it can't load
    return () => {
      active = false;
    };
  }, []);

  function handleDownloadDesktop() {
    onClose();
    router.push("/download");
  }

  // TODO(backend): start the real upgrade flow once billing exists.
  const handleUpgrade = () => setNotice("Upgrades aren't available yet.");

  return (
    <div className={`${s["modal-backdrop"]} ${s.center}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className={`${s.modal} ${s.upgrade}`} role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <header className={s["modal-head"]}>
          <div>
            <span className={s["modal-eyebrow"]}>NIRMARAKSH</span>
            <h2 id="upgrade-title">Do more with Nirmaraksh</h2>
          </div>
          <button ref={closeRef} type="button" className={s["modal-close"]} onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        </header>

        <section className={`${s["upgrade-section"]} ${s["desktop-card"]}`} aria-labelledby="desktop-title">
          <span className={s["desktop-icon"]}><Icon name="download" size={24} /></span>
          <div>
            <h3 id="desktop-title">Download the Desktop App</h3>
            <p>File uploads and more are available through the desktop app.</p>
            {releaseInfo && <p className={s["release-info"]}>{releaseInfo}</p>}
          </div>
          <button type="button" className={s["btn-primary"]} onClick={handleDownloadDesktop}>Get the desktop app</button>
        </section>

        <section className={s["upgrade-section"]} aria-labelledby="plans-title">
          <h3 id="plans-title" className={s["visually-hidden"]}>Plans</h3>
          <div className={s.plans}>
            <div className={s["plan-card"]}>
              <strong className={s["plan-name"]}>Free</strong>
              <p>Your current plan</p>
            </div>
            <div className={`${s["plan-card"]} ${s.featured}`}>
              <strong className={s["plan-name"]}>Upgrade</strong>
              <p>{upgradeIntro}</p>
              <ul className={s["feature-list"]}>
                {upgradeFeatures.map((feature) => (
                  <li key={feature}><Icon name="check" size={17} /> {feature}</li>
                ))}
              </ul>
              <button type="button" className={s["btn-primary"]} onClick={handleUpgrade}>Upgrade</button>
            </div>
          </div>
        </section>

        <p className={s["upgrade-notice"]} role="status">{notice}</p>
      </section>
    </div>
  );
}
