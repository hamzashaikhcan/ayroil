import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

const base: Props = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function IconHome(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M2.5 6.5L8 2l5.5 4.5V13a1 1 0 01-1 1h-3v-4h-3v4h-3a1 1 0 01-1-1V6.5z" />
    </svg>
  );
}

export function IconOrders(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
      <path d="M5 5.5h6M5 8h6M5 10.5h4" />
    </svg>
  );
}

export function IconProducts(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 1.5L13.5 4v8L8 14.5L2.5 12V4L8 1.5z" />
      <path d="M2.5 4L8 6.75L13.5 4M8 6.75v7.75" />
    </svg>
  );
}

export function IconCustomers(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="6" cy="5.5" r="2.25" />
      <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <path d="M10 4a2.25 2.25 0 010 4.5M11.5 13c0-1.7-1-3.2-2.5-3.7" />
    </svg>
  );
}

export function IconAnalytics(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M2.5 13.5h11" />
      <path d="M4.5 11V8M7.5 11V5.5M10.5 11V3.5M13 11V7" />
    </svg>
  );
}

export function IconSettings(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="8" cy="8" r="1.75" />
      <path d="M13 8c0-.4 0-.7-.1-1l1.3-1-1.2-2.1-1.6.4c-.5-.4-1.1-.7-1.7-.9L9.4 2H6.6l-.3 1.4c-.6.2-1.2.5-1.7.9l-1.6-.4L1.8 6l1.3 1c-.1.3-.1.6-.1 1s0 .7.1 1l-1.3 1 1.2 2.1 1.6-.4c.5.4 1.1.7 1.7.9l.3 1.4h2.8l.3-1.4c.6-.2 1.2-.5 1.7-.9l1.6.4 1.2-2.1-1.3-1c.1-.3.1-.6.1-1z" />
    </svg>
  );
}

export function IconSearch(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5" />
    </svg>
  );
}

export function IconChevronRight(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3l4 5-4 5" />
    </svg>
  );
}

export function IconChevronDown(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M3 6l5 4 5-4" />
    </svg>
  );
}

export function IconArrowUp(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
    </svg>
  );
}

export function IconArrowDown(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" />
    </svg>
  );
}

export function IconPlus(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

export function IconExternal(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M13 3L7.5 8.5" />
    </svg>
  );
}

export function IconLogout(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M9 3.5h2.5a1 1 0 011 1v7a1 1 0 01-1 1H9" />
      <path d="M2.5 8h7M7 5.5L9.5 8 7 10.5" />
    </svg>
  );
}

export function IconCart(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M2 3h2l1.2 7.5a1.5 1.5 0 001.5 1.25h5.3a1.5 1.5 0 001.5-1.2L14.5 5.5H4.5" />
      <circle cx="6" cy="13.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconStore(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M2.5 6.5L3.5 3h9l1 3.5" />
      <path d="M2.5 6.5v6.5h11V6.5" />
      <path d="M2.5 6.5a1.75 1.75 0 003.5 0 1.75 1.75 0 003.5 0 1.75 1.75 0 003.5 0" />
    </svg>
  );
}

export function IconCalendar(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

export function IconHero(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M2 7h12M5 10h3M5 11.5h5" />
    </svg>
  );
}

export function IconDoc(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 2h5l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M9 2v3h3M5.5 8h5M5.5 10h5M5.5 12h3" />
    </svg>
  );
}

export function IconHelp(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.25 6.25c0-1 .75-1.75 1.75-1.75s1.75.75 1.75 1.75c0 1.25-1.75 1.25-1.75 2.75" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconTruck(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M1.5 4h8v7h-8z" />
      <path d="M9.5 6.5h3l2 2.5V11h-5z" />
      <circle cx="4.5" cy="12" r="1.25" />
      <circle cx="11.5" cy="12" r="1.25" />
    </svg>
  );
}

export function IconRefund(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M3 7.5A5 5 0 0113 8" />
      <path d="M3 4.5V7.5h3" />
      <path d="M13 8.5A5 5 0 013 8" />
      <path d="M13 11.5V8.5h-3" />
    </svg>
  );
}

export function IconScale(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 2v12M3 14h10" />
      <path d="M3 7l-1.5 3a2 2 0 003 0L3 7zM13 7l-1.5 3a2 2 0 003 0L13 7z" />
      <path d="M3 7l5-2 5 2" />
    </svg>
  );
}

export function IconShield(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 1.5l5 1.5v5c0 3-2.5 5.5-5 6-2.5-.5-5-3-5-6V3l5-1.5z" />
    </svg>
  );
}

export function IconSparkles(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 2.5l1 2.7 2.7 1-2.7 1L8 10l-1-2.8-2.7-1 2.7-1L8 2.5z" />
      <path d="M12.5 9.5l.6 1.6 1.6.6-1.6.6-.6 1.7-.6-1.7-1.6-.6 1.6-.6.6-1.6z" />
    </svg>
  );
}
