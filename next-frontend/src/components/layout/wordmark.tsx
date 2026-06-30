"use client";

import Link from "next/link";
import { useSettings } from "@/components/providers/settings-context";
import { cloudinaryTransform } from "@/lib/cloudinary";

/**
 * Brand mark used in the navbar and footer.
 *
 * If the admin has uploaded a logo via /settings, we render it. Otherwise
 * we fall back to a generated badge with the first letter of the site name.
 *
 * `theme` picks which logo to use:
 *   - "light"  → for light/white backgrounds (navbar, footer) → uses darkLogoUrl
 *   - "dark"   → for dark backgrounds (admin login left rail) → uses whiteLogoUrl
 */
export function Wordmark({
  size = "md",
  theme = "light",
  showText = true,
}: {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
  showText?: boolean;
}) {
  const settings = useSettings();

  const px = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  const h = size === "sm" ? "h-5" : size === "lg" ? "h-12" : "h-9";
  const heightPx = size === "sm" ? 20 : size === "lg" ? 48 : 36;
  const badgeBox = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-8 w-8";

  // Prefer the logo for the active surface.
  const logoUrl = theme === "dark" ? settings.whiteLogoUrl : settings.darkLogoUrl;

  if (logoUrl) {
    // Cap the download to ~3x the display height (covers high-DPI screens)
    // instead of shipping the admin's full-resolution upload on every page.
    const optimizedUrl = cloudinaryTransform(logoUrl, `f_auto,q_auto,h_${heightPx * 3}`);
    return (
      <Link href="/" className="inline-flex items-center gap-2" aria-label={settings.siteName}>
        <span className={`relative inline-block ${h} w-auto`} style={{ aspectRatio: "auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- need natural width for a logo */}
          <img
            src={optimizedUrl}
            alt={settings.siteName}
            height={heightPx}
            className={`${h} w-auto object-contain`}
            draggable={false}
          />
        </span>
      </Link>
    );
  }

  // Generated fallback — first letter in a black square + accent dot.
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <span className={`relative inline-flex ${badgeBox} items-center justify-center rounded-md bg-ink text-background`}>
        <span className="font-display text-xs leading-none">
          {settings.siteName.charAt(0)}
        </span>
        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
      </span>
      {showText ? (
        <span className={`font-display ${px} tracking-tight text-ink truncate max-w-35 sm:max-w-none`}>
          {settings.siteName}
        </span>
      ) : null}
    </Link>
  );
}
