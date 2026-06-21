import { SITE } from "@consts";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Active currency. Defaults to seed values from consts; the admin layout
 * overrides these at request time using the SiteSettings the admin edited.
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

export function getActiveCurrency(): { code: string; symbol: string; locale: string } {
  return { code: active.code, symbol: active.symbol, locale: active.locale };
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

export function formatNumber(n: number): string {
  try {
    return new Intl.NumberFormat(active.locale).format(n);
  } catch {
    return String(n);
  }
}
