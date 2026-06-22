import { cache } from "react";
import { SITE } from "@consts";
import { API_URL } from "./api";

export type Settings = {
  siteName: string;
  slogan: string;
  shortDescription: string;
  longDescription: string;
  iconUrl: string;
  whiteLogoUrl: string;
  darkLogoUrl: string;
  ogImageUrl: string;
  domain: string;
  supportEmail: string;
  salesEmail: string;
  phone: string;
  address: string;
  social: {
    instagram?: string | null;
    x?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
    facebook?: string | null;
    linkedin?: string | null;
  };
  brand: {
    backgroundHex?: string;
    surfaceHex?: string;
    inkHex?: string;
    accentHex?: string;
    accentInkHex?: string;
    mutedHex?: string;
    lineHex?: string;
  };
  currencyCode: string;
  currencySymbol: string;
  currencyLocale: string;
  freeShippingThresholdCents: number;
  standardShippingCents: number;
  estStandardDays: string;
  returnsWindowDays: number;
  returnsPolicyUrl: string;
  productTimerEnabled: boolean;
  productTimerDurationSeconds: number;
  productTimerDiscountPercent: number;
  productTimerMessage: string;
  companyName: string;
  foundedYear: number;
  taxId: string;
  pageCopy: Record<string, { title?: string; body?: string }>;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImageUrl: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  benefitsTitle: string;
  benefitsBody: string;
  faqs: { q: string; a: string }[];
  termsTitle: string;
  termsBody: string;
  privacyTitle: string;
  privacyBody: string;
  shippingPolicyTitle: string;
  shippingPolicyBody: string;
  returnsPolicyTitle: string;
  returnsPolicyBody: string;
};

/** Fallback used when backend is unreachable — comes from consts/index.ts seed. */
const FALLBACK: Settings = {
  siteName: SITE.siteName,
  slogan: SITE.slogan,
  shortDescription: SITE.shortDescription,
  longDescription: SITE.longDescription,
  iconUrl: SITE.iconUrl,
  whiteLogoUrl: SITE.whiteLogoUrl,
  darkLogoUrl: SITE.darkLogoUrl,
  ogImageUrl: SITE.ogImageUrl,
  domain: SITE.domain,
  supportEmail: SITE.supportEmail,
  salesEmail: SITE.salesEmail,
  phone: SITE.phone,
  address: SITE.address,
  social: { ...SITE.social },
  brand: { ...SITE.brand },
  currencyCode: SITE.currency.code,
  currencySymbol: SITE.currency.symbol,
  currencyLocale: SITE.currency.locale,
  freeShippingThresholdCents: SITE.shipping.freeShippingThresholdCents,
  standardShippingCents: SITE.shipping.standardCostCents,
  estStandardDays: SITE.shipping.estStandardDays,
  returnsWindowDays: SITE.returns.windowDays,
  returnsPolicyUrl: SITE.returns.policyUrl,
  productTimerEnabled: false,
  productTimerDurationSeconds: 300,
  productTimerDiscountPercent: 10,
  productTimerMessage: "Offer ends in",
  companyName: SITE.legal.companyName,
  foundedYear: SITE.legal.foundedYear,
  taxId: SITE.legal.taxId,
  pageCopy: {},
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  heroDescription: "",
  heroImageUrl: "",
  heroPrimaryCtaLabel: "",
  heroPrimaryCtaHref: "",
  heroSecondaryCtaLabel: "",
  heroSecondaryCtaHref: "",
  benefitsTitle: "Benefits",
  benefitsBody: `<p>${SITE.longDescription}</p>`,
  faqs: [],
  termsTitle: "Terms of Service",
  termsBody: "",
  privacyTitle: "Privacy Policy",
  privacyBody: "",
  shippingPolicyTitle: "Shipping Policy",
  shippingPolicyBody: "",
  returnsPolicyTitle: "Returns & Refunds",
  returnsPolicyBody: "",
};

/**
 * Server-side, request-cached fetch. `cache()` dedupes calls within one
 * request so every page that needs settings only fetches once.
 */
export const fetchSettings = cache(async (): Promise<Settings> => {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: "no-store" });
    if (!res.ok) return FALLBACK;
    const body = (await res.json()) as Settings | null;
    return body ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
});
