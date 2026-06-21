import type { CSSProperties } from "react";
import type { Settings } from "./settings";

/**
 * Shift a hex color. Positive `amount` darkens (toward black), negative
 * lightens (toward white). Used to derive sibling tokens (--accent-deep,
 * --line-strong, --ink-soft) from the base palette so the admin only
 * picks the primary color.
 */
function shade(hex: string, amount: number): string {
  const m = hex.replace("#", "").trim();
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const k = Math.max(-1, Math.min(1, amount));
  const adjust = (c: number) => {
    if (k >= 0) return Math.round(c * (1 - k));
    return Math.round(c + (255 - c) * -k);
  };
  const to = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${to(adjust(r))}${to(adjust(g))}${to(adjust(b))}`;
}

/**
 * Build a CSS-variable style object from the admin-edited brand palette.
 * Returned object plugs straight into the `<html>` element's `style` prop:
 *
 *   <html style={brandStyle(settings)}>
 *
 * Because these are CSS custom properties, every Tailwind utility that
 * references them (`bg-background`, `text-ink`, `border-line`, etc.) picks
 * the values up automatically — no rebuild needed.
 */
export function brandStyle(settings: Settings): CSSProperties {
  const b = settings.brand ?? {};
  const style: Record<string, string> = {};

  if (b.backgroundHex) style["--background"] = b.backgroundHex;
  if (b.surfaceHex) style["--surface"] = b.surfaceHex;
  if (b.inkHex) {
    style["--ink"] = b.inkHex;
    // Soft ink shifts ~12% lighter so dark navbars / cards stay legible.
    style["--ink-soft"] = shade(b.inkHex, -0.12);
  }
  if (b.mutedHex) style["--muted"] = b.mutedHex;
  if (b.lineHex) {
    style["--line"] = b.lineHex;
    style["--line-strong"] = shade(b.lineHex, 0.08);
  }
  if (b.accentHex) {
    style["--accent"] = b.accentHex;
    style["--accent-deep"] = shade(b.accentHex, 0.12);
  }
  if (b.accentInkHex) style["--accent-ink"] = b.accentInkHex;

  return style as CSSProperties;
}
