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
  siteName: "Product Two",
  slogan: "One product. Built with intent.",
  shortDescription:
    "A single-product brand. The shop only ever lists what we choose to make — one thing at a time.",
  longDescription:
    "Product One designs, manufactures, and ships a single product line at a time. No catalogs, no variants, no fluff — just the one thing we believe in, built and shipped in-house.",

  iconUrl: "/brand/icon.svg",
  whiteLogoUrl: "/brand/logo-white.svg",
  darkLogoUrl: "/brand/logo-dark.svg",
  ogImageUrl: "/brand/og.png",

  domain: "productone.example",
  storefrontUrl: "http://localhost:3000",
  adminUrl: "http://localhost:3001",
  apiUrl: "http://localhost:4000",

  supportEmail: "support@productone.example",
  salesEmail: "hello@productone.example",
  phone: "+1 (212) 555-0142",
  address: "318 Foundry St, Brooklyn, NY",

  social: {
    instagram: "https://instagram.com/productone",
    x: "https://x.com/productone",
    youtube: "https://youtube.com/@productone",
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
    code: "USD",
    symbol: "$",
    locale: "en-US",
  },

  legal: {
    companyName: "Product One LLC",
    foundedYear: 2024,
    taxId: "00-0000000",
  },

  shipping: {
    freeShippingThresholdCents: 5000,
    standardCostCents: 600,
    estStandardDays: "3–5",
  },

  returns: {
    windowDays: 30,
    policyUrl: "/policies/returns",
  },
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
