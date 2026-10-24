type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

export const Apple = ({ className }: P) => (
  <svg {...base} fill="currentColor" stroke="none" className={className}>
    <path d="M17.05 12.54c-.02-2.3 1.87-3.4 1.96-3.45a4.2 4.2 0 0 0-3.31-1.79c-1.4-.14-2.75.83-3.46.83s-1.82-.81-3-.79a4.4 4.4 0 0 0-3.7 2.25c-1.6 2.77-.41 6.85 1.13 9.09.76 1.1 1.66 2.33 2.85 2.28 1.15-.05 1.58-.73 2.97-.73s1.78.73 3 .71c1.25-.02 2.04-1.12 2.79-2.22a9.2 9.2 0 0 0 1.26-2.63 3.96 3.96 0 0 1-2.49-3.55ZM14.75 5.2A4.05 4.05 0 0 0 15.68 2a4.1 4.1 0 0 0-2.66 1.37 3.84 3.84 0 0 0-.97 3.08 3.4 3.4 0 0 0 2.7-1.25Z" />
  </svg>
);

export const Monitor = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="2" y="3.5" width="20" height="13" rx="1.5" />
    <path d="M8 20.5h8M12 16.5v4" />
  </svg>
);

export const Moon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
  </svg>
);

export const Sun = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
);

export const Menu = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </svg>
);

export const X = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m5.5 5.5 13 13m0-13-13 13" />
  </svg>
);

export const ChevronDown = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const ArrowUpRight = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 17 17 7M8.5 7H17v8.5" />
  </svg>
);

export const Play = ({ className }: P) => (
  <svg {...base} fill="currentColor" className={className}>
    <path d="M7 4.5v15l13-7.5Z" />
  </svg>
);

export const Github = ({ className }: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" className={className}>
    <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.64 1.66.23 2.87.11 3.18.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .3Z" />
  </svg>
);
