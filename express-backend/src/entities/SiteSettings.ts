import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Singleton row holding everything the admin can edit about the storefront
 * brand. There's only ever one row (id = first inserted). The storefront
 * reads this on every render to pick up changes immediately.
 */
@Entity({ name: "site_settings" })
export class SiteSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Brand identity
  @Column({ type: "varchar", length: 120 })
  siteName!: string;

  @Column({ type: "varchar", length: 240, default: "" })
  slogan!: string;

  @Column({ type: "text", default: "" })
  shortDescription!: string;

  @Column({ type: "text", default: "" })
  longDescription!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  iconUrl!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  whiteLogoUrl!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  darkLogoUrl!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  ogImageUrl!: string;

  // Contact + presence
  @Column({ type: "varchar", length: 120, default: "" })
  domain!: string;

  @Column({ type: "varchar", length: 254, default: "" })
  supportEmail!: string;

  @Column({ type: "varchar", length: 254, default: "" })
  salesEmail!: string;

  @Column({ type: "varchar", length: 32, default: "" })
  phone!: string;

  @Column({ type: "varchar", length: 240, default: "" })
  address!: string;

  @Column({ type: "jsonb", default: () => "'{}'" })
  social!: {
    instagram?: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    linkedin?: string;
  };

  // Brand palette (free-form hexes used by storefront design tokens)
  @Column({ type: "jsonb", default: () => "'{}'" })
  brand!: {
    backgroundHex?: string;
    surfaceHex?: string;
    inkHex?: string;
    accentHex?: string;
    accentInkHex?: string;
    mutedHex?: string;
    lineHex?: string;
  };

  // Currency
  @Column({ type: "varchar", length: 8, default: "USD" })
  currencyCode!: string;

  @Column({ type: "varchar", length: 8, default: "$" })
  currencySymbol!: string;

  @Column({ type: "varchar", length: 12, default: "en-US" })
  currencyLocale!: string;

  // Shipping
  // When true, every order ships free regardless of the threshold below.
  @Column({ type: "boolean", default: false })
  freeShippingEnabled!: boolean;

  @Column({ type: "int", default: 5000 })
  freeShippingThresholdCents!: number;

  @Column({ type: "int", default: 600 })
  standardShippingCents!: number;

  @Column({ type: "varchar", length: 16, default: "3–5" })
  estStandardDays!: string;

  // Returns
  @Column({ type: "int", default: 30 })
  returnsWindowDays!: number;

  @Column({ type: "varchar", length: 500, default: "/policies/returns" })
  returnsPolicyUrl!: string;

  // Product detail urgency timer — optional countdown shown near purchase CTA.
  @Column({ type: "boolean", default: false })
  productTimerEnabled!: boolean;

  @Column({ type: "int", default: 300 })
  productTimerDurationSeconds!: number;

  @Column({ type: "int", default: 10 })
  productTimerDiscountPercent!: number;

  @Column({ type: "varchar", length: 180, default: "Offer ends in" })
  productTimerMessage!: string;

  // Email — Resend integration used to send order confirmation emails.
  // resendApiKey is a secret: the public GET /settings route strips it
  // before responding to unauthenticated/storefront callers.
  @Column({ type: "varchar", length: 255, default: "" })
  resendApiKey!: string;

  @Column({ type: "varchar", length: 254, default: "" })
  resendFromEmail!: string;

  // Legal
  @Column({ type: "varchar", length: 200, default: "" })
  companyName!: string;

  @Column({ type: "int", default: 2024 })
  foundedYear!: number;

  @Column({ type: "varchar", length: 80, default: "" })
  taxId!: string;

  // Page-level overrides (admin can edit copy without redeploying)
  @Column({ type: "jsonb", default: () => "'{}'" })
  pageCopy!: Record<string, { title?: string; body?: string }>;

  // Home hero section — admin-controlled headline and supporting copy.
  @Column({ type: "varchar", length: 120, default: "" })
  heroEyebrow!: string;

  @Column({ type: "varchar", length: 240, default: "" })
  heroTitle!: string;

  @Column({ type: "varchar", length: 240, default: "" })
  heroSubtitle!: string;

  @Column({ type: "text", default: "" })
  heroDescription!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  heroImageUrl!: string;

  @Column({ type: "varchar", length: 60, default: "" })
  heroPrimaryCtaLabel!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  heroPrimaryCtaHref!: string;

  @Column({ type: "varchar", length: 60, default: "" })
  heroSecondaryCtaLabel!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  heroSecondaryCtaHref!: string;

  // Benefits page — title is the H1, body is rich HTML from the admin editor.
  @Column({ type: "varchar", length: 240, default: "Benefits" })
  benefitsTitle!: string;

  @Column({ type: "text", default: "" })
  benefitsBody!: string;

  // Site-wide FAQs rendered on /faq and the homepage FAQ section.
  @Column({ type: "jsonb", default: () => "'[]'" })
  faqs!: { q: string; a: string }[];

  // Legal pages — rendered on /terms and /privacy.
  @Column({ type: "varchar", length: 240, default: "Terms of Service" })
  termsTitle!: string;

  @Column({ type: "text", default: "" })
  termsBody!: string;

  @Column({ type: "varchar", length: 240, default: "Privacy Policy" })
  privacyTitle!: string;

  @Column({ type: "text", default: "" })
  privacyBody!: string;

  // Policy pages — rendered on /shipping and /returns.
  @Column({ type: "varchar", length: 240, default: "Shipping Policy" })
  shippingPolicyTitle!: string;

  @Column({ type: "text", default: "" })
  shippingPolicyBody!: string;

  @Column({ type: "varchar", length: 240, default: "Returns & Refunds" })
  returnsPolicyTitle!: string;

  @Column({ type: "text", default: "" })
  returnsPolicyBody!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
