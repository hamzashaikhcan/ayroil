export type SettingsLike = {
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
  freeShippingEnabled: boolean;
  freeShippingThresholdCents: number;
  standardShippingCents: number;
  estStandardDays: string;
  returnsWindowDays: number;
  returnsPolicyUrl: string;
  productTimerEnabled: boolean;
  productTimerDurationSeconds: number;
  productTimerDiscountPercent: number;
  productTimerMessage: string;
  resendApiKey: string;
  resendFromEmail: string;
  companyName: string;
  foundedYear: number;
  taxId: string;
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

export const CURRENCIES: { code: string; symbol: string; locale: string; label: string }[] = [
  { code: "USD", symbol: "$", locale: "en-US", label: "USD · US Dollar" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "EUR · Euro" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "GBP · British Pound" },
  { code: "PKR", symbol: "Rs", locale: "en-PK", label: "PKR · Pakistani Rupee" },
  { code: "INR", symbol: "₹", locale: "en-IN", label: "INR · Indian Rupee" },
  { code: "AED", symbol: "د.إ", locale: "en-AE", label: "AED · UAE Dirham" },
  { code: "SAR", symbol: "﷼", locale: "ar-SA", label: "SAR · Saudi Riyal" },
  { code: "CAD", symbol: "$", locale: "en-CA", label: "CAD · Canadian Dollar" },
  { code: "AUD", symbol: "$", locale: "en-AU", label: "AUD · Australian Dollar" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", label: "JPY · Japanese Yen" },
];
