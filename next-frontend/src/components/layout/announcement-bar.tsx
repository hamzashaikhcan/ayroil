import type { Settings } from "@/lib/settings";

/**
 * Thin, site-wide strip shown on every page when the admin has turned on
 * free shipping (Settings → Commerce → Shipping). Server-rendered from the
 * same settings the rest of the storefront reads, so it appears the moment
 * the toggle is saved (on next page load).
 */
export function AnnouncementBar({ settings }: { settings: Settings }) {
  if (!settings.freeShippingEnabled) return null;

  return (
    <div className="bg-accent text-accent-ink">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-1.5 px-3 py-2 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.08em] sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 flex-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
          <circle cx="7" cy="17" r="1.6" />
          <circle cx="17.5" cy="17" r="1.6" />
        </svg>
        <span className="min-w-0">
          Free shipping on all orders<span className="hidden sm:inline"> — no minimum.</span>
        </span>
      </div>
    </div>
  );
}
