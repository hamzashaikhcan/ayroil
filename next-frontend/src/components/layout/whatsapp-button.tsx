"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = "923091238888";
const TEASER_DISMISS_KEY = "wa-teaser-dismissed";

/** Matches a product detail page: /shop/<slug> (but not the /shop listing itself). */
function isProductDetail(pathname: string): boolean {
  return /^\/shop\/[^/]+$/.test(pathname);
}

export function WhatsAppButton() {
  const pathname = usePathname();

  // Teaser bubble: slides in once per session after a short delay, dismissible.
  const [teaser, setTeaser] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(TEASER_DISMISS_KEY)) return;
    const t = setTimeout(() => setTeaser(true), 4000);
    return () => clearTimeout(t);
  }, []);

  function dismissTeaser() {
    setTeaser(false);
    sessionStorage.setItem(TEASER_DISMISS_KEY, "1");
  }

  const onProduct = isProductDetail(pathname);

  // Server-rendered href is the plain chat link; on a product detail page the
  // click handler swaps in a message referencing the item's full URL right
  // before navigation (origin is only known in the browser).
  const href = `https://wa.me/${WHATSAPP_NUMBER}`;
  function enrichHref(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!onProduct) return;
    const text = `I need detail about this following item ${window.location.origin}${pathname}`;
    e.currentTarget.href = `${href}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="whatsapp-fab fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5 transition-[bottom] duration-300">
      {teaser ? (
        <div className="wa-teaser relative max-w-56 rounded-2xl rounded-br-md border border-line bg-surface p-3 pr-8 shadow-lg">
          <button
            type="button"
            onClick={dismissTeaser}
            aria-label="Dismiss"
            className="absolute right-2 top-2 rounded-full p-0.5 text-muted transition-colors hover:bg-line/60 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              enrichHref(e);
              dismissTeaser();
            }}
            className="block"
          >
            <p className="text-xs font-semibold text-ink">
              {onProduct ? "Questions about this product?" : "Need a hand?"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {onProduct ? "Ask us on WhatsApp, we reply fast." : "Chat with us on WhatsApp, we reply fast."}
            </p>
          </a>
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={enrichHref}
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="group relative flex h-14 min-w-14 items-center justify-center rounded-full bg-[#25D366] px-3.5 text-white shadow-lg transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <span aria-hidden className="wa-ping absolute inset-0 rounded-full bg-[#25D366]" />
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="relative h-7 w-7 shrink-0"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-40 group-focus-visible:opacity-100">
          Chat with us
        </span>
      </a>
    </div>
  );
}
