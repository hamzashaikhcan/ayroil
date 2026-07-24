import { Router } from "express";
import { z } from "zod";
import { ROLES } from "@consts";
import { AppDataSource } from "../data-source.js";
import { SiteSettings } from "../entities/SiteSettings.js";
import { ENV } from "../config/env.js";
import { requireAdmin } from "../middleware/auth.js";

export const settingsRouter: Router = Router();

/**
 * Public read: storefront calls this every render to pick up brand changes
 * immediately. Returns the single settings row (auto-created on first run
 * via seed). `resendApiKey` is a secret and is stripped unless the caller
 * is an authenticated admin (the admin console's own settings pages).
 */
settingsRouter.get("/", async (req, res) => {
  const repo = AppDataSource.getRepository(SiteSettings);
  const row = await repo.findOne({ where: {}, order: { createdAt: "ASC" } });
  if (!row) return res.json(row);
  const isAdmin = req.auth?.role === ROLES.ADMIN && req.auth?.aud === ENV.auth.adminAudience;
  if (isAdmin) return res.json(row);
  const { resendApiKey, ...publicRow } = row;
  res.json(publicRow);
});

const socialSchema = z
  .object({
    instagram: z.string().optional().nullable(),
    x: z.string().optional().nullable(),
    youtube: z.string().optional().nullable(),
    tiktok: z.string().optional().nullable(),
    facebook: z.string().optional().nullable(),
    linkedin: z.string().optional().nullable(),
  })
  .partial();

const brandSchema = z
  .object({
    backgroundHex: z.string().optional().nullable(),
    surfaceHex: z.string().optional().nullable(),
    inkHex: z.string().optional().nullable(),
    accentHex: z.string().optional().nullable(),
    accentInkHex: z.string().optional().nullable(),
    mutedHex: z.string().optional().nullable(),
    lineHex: z.string().optional().nullable(),
  })
  .partial();

const settingsSchema = z
  .object({
    siteName: z.string().min(1).max(120),
    slogan: z.string().max(240),
    shortDescription: z.string(),
    longDescription: z.string(),
    iconUrl: z.string(),
    whiteLogoUrl: z.string(),
    darkLogoUrl: z.string(),
    ogImageUrl: z.string(),
    domain: z.string(),
    supportEmail: z.string(),
    salesEmail: z.string(),
    phone: z.string(),
    address: z.string(),
    social: socialSchema,
    brand: brandSchema,
    currencyCode: z.string().min(1).max(8),
    currencySymbol: z.string().min(1).max(8),
    currencyLocale: z.string().min(2).max(12),
    freeShippingEnabled: z.boolean(),
    freeShippingThresholdCents: z.number().int().min(0),
    standardShippingCents: z.number().int().min(0),
    estStandardDays: z.string(),
    returnsWindowDays: z.number().int().min(0),
    returnsPolicyUrl: z.string(),
    orderNote: z.string(),
    productTimerEnabled: z.boolean(),
    productTimerDurationSeconds: z.number().int().min(1).max(86400),
    productTimerDiscountPercent: z.number().int().min(1).max(95),
    productTimerMessage: z.string().max(180),
    resendApiKey: z.string().max(255),
    resendFromEmail: z.string().max(254),
    companyName: z.string(),
    foundedYear: z.number().int().min(1900).max(2100),
    taxId: z.string(),
    pageCopy: z.record(z.string(), z.object({ title: z.string().optional(), body: z.string().optional() })),
    heroEyebrow: z.string().max(120),
    heroTitle: z.string().max(240),
    heroSubtitle: z.string().max(240),
    heroDescription: z.string(),
    heroImageUrl: z.string(),
    heroPrimaryCtaLabel: z.string().max(60),
    heroPrimaryCtaHref: z.string().max(500),
    heroSecondaryCtaLabel: z.string().max(60),
    heroSecondaryCtaHref: z.string().max(500),
    benefitsTitle: z.string().max(240),
    benefitsBody: z.string(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })),
    termsTitle: z.string().max(240),
    termsBody: z.string(),
    privacyTitle: z.string().max(240),
    privacyBody: z.string(),
    shippingPolicyTitle: z.string().max(240),
    shippingPolicyBody: z.string(),
    returnsPolicyTitle: z.string().max(240),
    returnsPolicyBody: z.string(),
  })
  .partial();

settingsRouter.put("/", requireAdmin, async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  }
  const repo = AppDataSource.getRepository(SiteSettings);
  const existing = await repo.findOne({ where: {}, order: { createdAt: "ASC" } });
  if (!existing) {
    const created = await repo.save(repo.create(parsed.data as Partial<SiteSettings>));
    return res.json(created);
  }
  repo.merge(existing, parsed.data as Partial<SiteSettings>);
  const saved = await repo.save(existing);
  res.json(saved);
});
