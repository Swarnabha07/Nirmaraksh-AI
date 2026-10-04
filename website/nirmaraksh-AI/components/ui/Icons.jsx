export function AgentIcon({ kind }) {
  const paths = {
    recon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5M11 7.5v7M7.5 11h7" />
      </>
    ),

    analysis: (
      <>
        <path d="M3 18.5h18M5.5 15.5l4-4 3 2.5 6-7" />
        <path d="M15.5 7h3v3" />
      </>
    ),

    verification: (
      <>
        <path d="m12 2.5 8 3.2v5.7c0 5-3.2 8.3-8 10.1-4.8-1.8-8-5.1-8-10.1V5.7L12 2.5Z" />
        <path d="m8.5 11.8 2.5 2.5 4.7-5" />
      </>
    ),

    reporting: (
      <>
        <path d="M6 2.5h9l4 4V21H6V2.5Z" />
        <path d="M15 2.5v4h4M9 11h7M9 14.5h7M9 18h4" />
      </>
    ),

    coding: (
      <>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </>
    ),

    development: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
        <path d="M7 8h10M7 12h6M7 16h8" />
      </>
    ),

    flight: (
      <>
        <path d="m3 13 18-6-6 18-3.5-8.5L3 13Z" />
        <path d="m11.5 16.5 4-4" />
      </>
    ),

    system: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4M16 16h.01" />
      </>
    ),

    manager: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="3" r="1.5" />
        <circle cx="21" cy="12" r="1.5" />
        <circle cx="12" cy="21" r="1.5" />
        <circle cx="3" cy="12" r="1.5" />
        <path d="M12 9V4.5M15 12h4.5M12 15v4.5M9 12H4.5" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}

export function ArrowIcon({ diagonal = false }) {
  return diagonal ? (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 15.5 15 5M6.5 5H15v8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeatureIcon({ name }) {
  const paths = {
    isolated: (
      <>
        <rect x="3" y="4" width="7" height="7" rx="1.5" />
        <rect x="14" y="13" width="7" height="7" rx="1.5" />
        <path d="m10 14 4-4" strokeDasharray="2 3" />
      </>
    ),
    scattered: (
      <>
        <rect x="3" y="4" width="7" height="6" rx="1" />
        <rect x="14" y="4" width="7" height="6" rx="1" />
        <rect x="8.5" y="15" width="7" height="6" rx="1" />
        <path d="M6 7h1m10 0h1m-6 11h1" />
      </>
    ),
    manual: (
      <>
        <path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5" />
        <path d="M18 3v4h-4M6 21v-4h4" />
        <path d="M12 8v4l2.5 1.5" />
      </>
    ),
    understand: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5M8 10.5h5M10.5 8v5" />
      </>
    ),
    plan: (
      <>
        <path d="M4 4.5h5v5H4zM15 4.5h5v5h-5zM9.5 15h5v5h-5zM9 7h6M17.5 9.5v2.5l-5.5 3M6.5 9.5V12l5.5 3" />
      </>
    ),
    execute: (
      <>
        <path d="m13 2-9 11h7l-1 9 10-12h-7l0-8Z" />
      </>
    ),
    analyze: (
      <>
        <path d="M3 18.5h18M5 15l4-4 3 2.5 6-7M15.5 6.5H18v2.5" />
        <circle cx="9" cy="11" r="1" />
      </>
    ),
    verify: (
      <>
        <path d="m12 2.5 8 3.2v5.7c0 5-3.2 8.3-8 10.1-4.8-1.8-8-5.1-8-10.1V5.7L12 2.5Z" />
        <path d="m8.5 11.8 2.5 2.5 4.7-5" />
      </>
    ),
    approval: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h4m-4 4 2 2 5-5" />
      </>
    ),
    audit: (
      <>
        <path d="M5 3h11l3 3v15H5V3Z" />
        <path d="M16 3v4h3M8 10h8M8 14h8M8 18h5" />
      </>
    ),
    targets: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
        <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
      </>
    ),
    compliance: (
      <>
        <path d="M12 2.5 20 6v5.7c0 5-3.2 8-8 9.8-4.8-1.8-8-4.8-8-9.8V6l8-3.5Z" />
        <path d="M9 11h6M9 14h6M10 8h4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function RadialGeometry({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="300" cy="300" r="278" />
      <circle cx="300" cy="300" r="236" />
      {Array.from({ length: 24 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 15} 300 300)`}>
          <path d="M300 16v18m0 9v8M300 62v15M294 39h12" />
          <ellipse cx="300" cy="201" rx="59" ry="133" />
        </g>
      ))}
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m7 4.5 8 5.5-8 5.5v-11Z" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m3 8 3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
