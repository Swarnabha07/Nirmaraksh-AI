"use client";

import { useEffect, useState } from "react";
import { downloadForPlatform, getLatestReleases } from "@/lib/api";
import { ArrowIcon } from "@/components/ui/Icons";
import s from "@/app/download/download.module.css";

function PlatformSvg({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function WindowsIcon() {
  return (
    <PlatformSvg>
      <path
        d="m3.5 5.3 7-1v7h-7v-6Zm8.2-1.2 8.8-1.3v8.5h-8.8V4.1ZM3.5 12.7h7v7l-7-1v-6Zm8.2 0h8.8v8.5l-8.8-1.3v-7.2Z"
        fill="currentColor"
      />
    </PlatformSvg>
  );
}

function AppleIcon() {
  return (
    <PlatformSvg>
      <path
        d="M16.9 12.6c0-2.5 2-3.7 2.1-3.8a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.7.9-.8 0-2-1-3.2-.9a4.8 4.8 0 0 0-4 2.4c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.9-1.1-2.9-3.6ZM14.4 5.3c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1 0 2.3-.6 3-1.5Z"
        fill="currentColor"
      />
    </PlatformSvg>
  );
}

function LinuxIcon() {
  return (
    <PlatformSvg>
      <path
        d="M12 2.5c-3 0-4 2.8-3.8 5.2-1.9 1.5-3.2 4.6-3.4 7.3-.1 1.8.7 2.8 2 2.8.6 2.4 2.5 3.7 5.2 3.7s4.6-1.3 5.2-3.7c1.3 0 2.1-1 2-2.8-.2-2.7-1.5-5.8-3.4-7.3.2-2.4-.8-5.2-3.8-5.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M9.6 8.3h.1m4.6 0h.1M10 11.3c1.3.8 2.7.8 4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M8.2 17.5c2.5-1 5.1-1 7.6 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </PlatformSvg>
  );
}

function DownloadIcon() {
  return (
    <PlatformSvg>
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </PlatformSvg>
  );
}

// Windows ships as a ZIP through the existing /api/downloads pipeline.
// macOS and Linux open the link stored in the release row (a GitHub repository) in a new tab.
const PLATFORMS = [
  {
    id: "windows",
    name: "Windows",
    subtitle: "ZIP package",
    Icon: WindowsIcon,
  },
  { id: "mac", name: "macOS", subtitle: "Repository link", Icon: AppleIcon },
  { id: "linux", name: "Linux", subtitle: "Repository link", Icon: LinuxIcon },
];

const STATUS_LABEL = {
  download: "AVAILABLE",
  link: "AVAILABLE",
  unpublished: "NOT PUBLISHED YET",
  loading: "CHECKING",
  error: "UNAVAILABLE",
};

const DISABLED_LABEL = {
  unpublished: "Not published yet",
  loading: "Checking availability…",
  error: "Unavailable",
};

const SHA256 = /^[a-f0-9]{64}$/i;

const isHttpsUrl = (value) =>
  typeof value === "string" && /^https:\/\//i.test(value);

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function fileType(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(fileName || "");
  return match ? match[1].toUpperCase() : "";
}

function linkLabel(url) {
  try {
    return new URL(url).hostname === "github.com"
      ? "View on GitHub"
      : "Open download page";
  } catch {
    return "Open download page";
  }
}

export default function DownloadPlatforms() {
  const [releases, setReleases] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState("");
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    let active = true;
    setReleases(null);
    setLoadError(false);
    getLatestReleases()
      .then((list) => {
        if (active) setReleases(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  // /api/releases/latest returns flagged placeholder rows when nothing is published in the database.
  const published =
    releases !== null && !releases.some((release) => release.isFallback);
  const byPlatform = published
    ? Object.fromEntries(releases.map((release) => [release.platform, release]))
    : {};
  const version = published ? releases[0]?.version : "";

  function resolve(id) {
    if (loadError) return { state: "error" };
    if (releases === null) return { state: "loading" };
    const release = byPlatform[id];
    if (!release?.download_url) return { state: "unpublished" };
    if (id === "windows") return { state: "download", release };
    return isHttpsUrl(release.download_url)
      ? { state: "link", release }
      : { state: "unpublished" };
  }

  async function handleDownload(id) {
    setBusy(id);
    setCardErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      await downloadForPlatform(id);
    } catch (err) {
      setCardErrors((prev) => ({
        ...prev,
        [id]: err?.message || "Download failed. Please try again.",
      }));
    } finally {
      setBusy("");
    }
  }

  const resolved = PLATFORMS.map((platform) => ({
    platform,
    ...resolve(platform.id),
  }));
  const hasChecksum = resolved.some(({ release }) =>
    SHA256.test(release?.sha256Checksum || ""),
  );

  return (
    <>
      {version && <p className={s.releaseVersion}>Latest version {version}</p>}

      <div className={s.platformGrid}>
        {resolved.map(({ platform, state, release }) => {
          const { id, name, subtitle, Icon } = platform;
          const checksum = SHA256.test(release?.sha256Checksum || "")
            ? release.sha256Checksum
            : "";
          const rows = release
            ? [
                ["Version", release.version],
                ["File", release.fileName],
                ["Size", formatSize(release.fileSizeBytes)],
                ["SHA-256", checksum],
              ].filter(([, value]) => value)
            : [];
          const meta = release
            ? [fileType(release.fileName), formatSize(release.fileSizeBytes)]
                .filter(Boolean)
                .join(" · ")
            : "";

          return (
            <article className={s.card} key={id}>
              <div className={s.cardScan} aria-hidden="true" />
              <div className={s.cardTop}>
                <div className={s.platformIcon}>
                  <Icon />
                </div>
                <div className={`${s.status} ${s[`status-${state}`]}`}>
                  <i /> {STATUS_LABEL[state]}
                </div>
              </div>
              <h3>{name}</h3>
              <p className={s.cardSub}>{subtitle}</p>

              {rows.length > 0 && (
                <dl className={s.meta}>
                  {rows.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd className={label === "SHA-256" ? s.hash : undefined}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className={s.cardFooter}>
                {state === "download" && (
                  <button
                    type="button"
                    className={s.action}
                    onClick={() => handleDownload(id)}
                    disabled={busy === id}
                  >
                    <span>
                      {busy === id
                        ? "Preparing download…"
                        : `Download for ${name}`}
                      {meta && <small>{meta}</small>}
                    </span>
                    <DownloadIcon />
                  </button>
                )}
                {state === "link" && (
                  <a
                    className={s.action}
                    href={release.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      {linkLabel(release.download_url)}
                      {meta && <small>{meta}</small>}
                    </span>
                    <ArrowIcon diagonal />
                  </a>
                )}
                {DISABLED_LABEL[state] && (
                  <button type="button" className={s.action} disabled>
                    <span>{DISABLED_LABEL[state]}</span>
                  </button>
                )}
                {cardErrors[id] && (
                  <p className={s.cardError} role="alert">
                    {cardErrors[id]}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className={s.systemNote} role="status">
        {loadError ? (
          <>
            Couldn&apos;t load release information.{" "}
            <button
              type="button"
              className={s.retry}
              onClick={() => setAttempt((n) => n + 1)}
            >
              Retry
            </button>
          </>
        ) : releases !== null && !published ? (
          "Installers haven't been published yet."
        ) : hasChecksum ? (
          "Compare the SHA-256 checksum of your download with the value shown on its card to verify it."
        ) : null}
      </p>
    </>
  );
}
