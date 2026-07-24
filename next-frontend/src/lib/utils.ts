import { SITE } from "@consts";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Active currency config. Defaults to the seed values from consts/index.ts;
 * SettingsProvider overwrites these on mount so every formatPrice call
 * across server *and* client picks up the admin-edited currency.
 *
 * For SSR / RSC, server data fetchers should call setActiveCurrency()
 * after fetching settings — but in practice the layout.tsx fetches settings
 * before any child renders, so this is safe.
 */
const active = {
  code: SITE.currency.code as string,
  symbol: SITE.currency.symbol as string,
  locale: SITE.currency.locale as string,
};

export function setActiveCurrency(next: { code: string; symbol: string; locale: string }) {
  active.code = next.code;
  active.symbol = next.symbol;
  active.locale = next.locale;
}

export function getActiveCurrencyCode(): string {
  return active.code;
}

export function formatPrice(cents: number): string {
  try {
    return new Intl.NumberFormat(active.locale, {
      style: "currency",
      currency: active.code,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    const value = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
    return `${active.symbol}${value}`;
  }
}

// This store operates in Pakistan only — every date/time shown anywhere
// (server-rendered or client-rendered) must read as Asia/Karachi time
// regardless of the server's or the viewer's own timezone. Never format a
// date with the ambient locale/timezone directly; always go through these.
const APP_TIMEZONE = "Asia/Karachi";
const DEFAULT_DATE_OPTS: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
const DEFAULT_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTS): string {
  try {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: APP_TIMEZONE }).format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

export function formatDateTime(date: Date | string, opts: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTS): string {
  try {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: APP_TIMEZONE }).format(new Date(date));
  } catch {
    return new Date(date).toISOString();
  }
}
