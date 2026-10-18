import type { ReactNode } from "react";

export type IconName =
  | "type"
  | "sparkle"
  | "play"
  | "pause"
  | "save"
  | "download"
  | "library"
  | "chevron"
  | "plus"
  | "eye"
  | "eyeOff"
  | "copy"
  | "trash"
  | "check"
  | "close"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "arrow"
  | "film"
  | "file"
  | "clock"
  | "layers"
  | "corner"
  | "sun"
  | "moon"
  | "undo"
  | "redo";

export function StudioIcon({
  name,
  size = 16,
}: {
  name: IconName;
  size?: number;
}) {
  const paths: Record<IconName, ReactNode> = {
    type: (
      <>
        <path d="M4 5h16M12 5v14M8 19h8" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
    pause: (
      <>
        <path
          d="M8 5h3v14H8zM15 5h3v14h-3z"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
    save: (
      <>
        <path d="M5 4h12l3 3v13H4V4h1Z" />
        <path d="M8 4v5h8V4M8 20v-7h8v7" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M5 18v3h14v-3" />
      </>
    ),
    library: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" />
        <path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h8M8 10h6" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18M10.6 6.2A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17.5 17.5 0 0 1-3 3.5M6.2 6.7C3.8 8.3 2.5 12 2.5 12s3.5 6 9.5 6c.9 0 1.8-.2 2.6-.4" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    alignLeft: (
      <>
        <path d="M4 5h16M4 9h10M4 13h16M4 17h10" />
      </>
    ),
    alignCenter: (
      <>
        <path d="M4 5h16M7 9h10M4 13h16M7 17h10" />
      </>
    ),
    alignRight: (
      <>
        <path d="M4 5h16M10 9h10M4 13h16M10 17h10" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    film: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 5v14m10-14v14M3 10h4m-4 4h4m10-4h4m-4 4h4" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l5 5v13H6z" />
        <path d="M14 3v6h5M9 13h7M9 17h7" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    corner: (
      <>
        <path d="M5 19V5h14" />
        <path d="m12 12 7-7" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M20.8 13.1A8.9 8.9 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z" />,
    undo: (
      <>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h9a7 7 0 0 1 0 14h-1" />
      </>
    ),
    redo: (
      <>
        <path d="m15 14 5-5-5-5" />
        <path d="M20 9h-9a7 7 0 0 0 0 14h1" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
