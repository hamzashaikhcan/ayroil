import { Router } from "express";
import { z } from "zod";
import { ENV } from "../config/env.js";
import { AppDataSource } from "../data-source.js";
import { PushSubscription } from "../entities/PushSubscription.js";
import { isPushConfigured, sendAdminPush } from "../lib/push.js";
import { requireAdmin } from "../middleware/auth.js";

export const pushRouter: Router = Router();

// Every push route is admin-only — notifications are an admin-console feature.
pushRouter.use(requireAdmin);

// The VAPID public key the browser needs to create a subscription.
pushRouter.get("/public-key", (_req, res) => {
  res.json({ publicKey: ENV.webPush.publicKey, configured: isPushConfigured() });
});

const subscribeSchema = z.object({
  endpoint: z.string().min(1).max(512),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});

// Upsert a device subscription, keyed by its unique endpoint.
pushRouter.post("/subscribe", async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });

  const repo = AppDataSource.getRepository(PushSubscription);
  const { endpoint, keys } = parsed.data;
  const userAgent = (req.headers["user-agent"] ?? "").slice(0, 300);

  const existing = await repo.findOne({ where: { endpoint } });
  if (existing) {
    existing.p256dh = keys.p256dh;
    existing.auth = keys.auth;
    existing.userId = req.auth?.sub ?? null;
    existing.userAgent = userAgent;
    await repo.save(existing);
  } else {
    await repo.save(
      repo.create({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: req.auth?.sub ?? null,
        userAgent,
      }),
    );
  }

  res.status(201).json({ ok: true });
});

const unsubscribeSchema = z.object({ endpoint: z.string().min(1).max(512) });

pushRouter.post("/unsubscribe", async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
  await AppDataSource.getRepository(PushSubscription).delete({ endpoint: parsed.data.endpoint });
  res.json({ ok: true });
});

// Lets an admin fire a test notification to their own devices after enabling.
pushRouter.post("/test", async (_req, res) => {
  await sendAdminPush({
    title: "🔔 Notifications enabled",
    body: "You'll get a ping here whenever a new order comes in.",
    url: "/orders",
    tag: "push-test",
  });
  res.json({ ok: true });
});
