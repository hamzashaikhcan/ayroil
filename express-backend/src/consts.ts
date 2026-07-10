/**
 * Shared site configuration consumed by every app in this monorepo.
 *
 * Import from this single source so brand changes propagate everywhere.
 *   express-backend → src/config/site.ts re-exports from here
 *   next-frontend   → @consts (tsconfig path) → these values
 *   admin-panel     → @consts (tsconfig path) → these values
 *
 * Swap product/brand values here; do not duplicate them per-app.
 */

export const SITE = {
  siteName: "Ayroil",
  slogan: "Scalp first. Hair follows.",
  shortDescription:
    "A scalp-first natural hair oil for dry, dandruff-prone scalp, weak roots, and hair fall concerns. Formulated under the guidance of Dr. Maria.",
  longDescription:
    "Ayroil was created for people who are tired of confusing hair care routines, heavy oils, and exaggerated claims. We wanted a cleaner, simpler way to care for the scalp using natural oils known for nourishment, comfort, and hair strength support. Our belief is simple: when the scalp is cared for properly, hair has a better chance to look and feel healthier. That is why Ayroil is built around scalp-first care, guided by Dr. Maria.",

  iconUrl: "/brand/icon.svg",
  whiteLogoUrl: "/brand/logo-white.svg",
  darkLogoUrl: "/brand/logo-dark.svg",
  ogImageUrl: "/brand/og.png",

  domain: "ayroil.pk",
  storefrontUrl: "http://localhost:3000",
  adminUrl: "http://localhost:3001",
  apiUrl: "http://localhost:4000",

  supportEmail: "ayroil.pk@gmail.com",
  salesEmail: "ayroil.pk@gmail.com",
  phone: "+92 309 1238888",
  address: "",

  social: {
    instagram: "https://instagram.com/ayroil",
    facebook: "https://facebook.com/ayroil",
  },

  brand: {
    backgroundHex: "#fafaf9",
    surfaceHex: "#ffffff",
    inkHex: "#0a0a0b",
    accentHex: "#cdfb4a",
    accentInkHex: "#0a0a0b",
    mutedHex: "#6b6b70",
    lineHex: "#e6e6e3",
  },

  currency: {
    code: "PKR",
    symbol: "Rs",
    locale: "en-PK",
  },

  legal: {
    companyName: "Ayroil",
    foundedYear: 2024,
    taxId: "00-0000000",
  },

  shipping: {
    freeShippingThresholdCents: 5000,
    standardCostCents: 600,
    estStandardDays: "3-4",
  },

  returns: {
    windowDays: 7,
    policyUrl: "/policies/returns",
  },
} as const;

/**
 * Aggregate rating emitted in Product structured data (JSON-LD).
 * `fallbackReviewCount` is used only when the product has no visible
 * reviews yet; the real review count from the backend takes precedence.
 */
export const PRODUCT_RATING = {
  value: 4.9,
  best: 5,
  fallbackReviewCount: 120,
} as const;

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ORDER_STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  AUTHORIZED: "authorized",
  PAID: "paid",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
