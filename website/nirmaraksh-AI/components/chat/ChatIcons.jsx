import s from "./chat.module.css";

export function Icon({ name, size = 22 }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </>
    ),
    tools: (
      <>
        <path d="m14.5 5.5 4-4 4 4-4 4M13 7l4 4M3 21l8.5-8.5" />
        <path d="M9 5 5 1 1 5l4 4M7 7l14 14M4 20l-1 1" />
      </>
    ),
    pin: (
      <>
        <path d="M8 3h8l-1.5 6 3.5 3H6l3.5-3zM12 12v9" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    send: <path d="m3 4 18 8-18 8 3-8zM6 12h15" />,
    mic: (
      <>
        <rect x="8" y="2" width="8" height="14" rx="4" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v12H9l-5 4z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    collapse: <path d="m15 6-6 6 6 6M20 6l-6 6 6 6" />,
    stop: (
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" strokeWidth="2.5" />,
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    back: <path d="m15 18-6-6 6-6" />,
    more: <path d="M12 5h.01M12 12h.01M12 19h.01" />,
    rename: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
    close: <path d="M5 5l14 14M19 5 5 19" />,
    download: <path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16" />,
    expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={s.icon}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

export function LogoMark() {
  return (
    <svg aria-hidden="true" className={s["logo-mark"]} viewBox="0 0 42 38">
      <path d="M4 4h9l22 30h-9z" fill="currentColor" />
      <path d="M29 4h9v30h-9zM4 13h9v21H4z" fill="currentColor" />
      <path d="m5 4 9 9h-4L1 4z" fill="#08e8ff" opacity=".75" />
    </svg>
  );
}
