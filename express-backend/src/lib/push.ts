import webpush from "web-push";
import { ENV } from "../config/env.js";
import { AppDataSource } from "../data-source.js";
import { PushSubscription } from "../entities/PushSubscription.js";
import type { Order } from "../entities/Order.js";
import type { Review } from "../entities/Review.js";
import type { SiteSettings } from "../entities/SiteSettings.js";

let vapidConfigured = false;

export function isPushConfigured(): boolean {
  return Boolean(ENV.webPush.publicKey && ENV.webPush.privateKey);
}

function ensureConfigured(): boolean {
  if (!isPushConfigured()) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(ENV.webPush.subject, ENV.webPush.publicKey, ENV.webPush.privateKey);
    vapidConfigured = true;
  }
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Relative admin path opened when the notification is tapped. */
  url?: string;
  /** Collapse key so repeat alerts for the same entity replace each other. */
  tag?: string;
};

/**
 * Sends a notification to every subscribed admin device. Fire-and-forget:
 * failures are logged, and subscriptions the push service reports as gone
 * (404/410) are pruned so the table stays clean.
 */
export async function sendAdminPush(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const repo = AppDataSource.getRepository(PushSubscription);
  const subs = await repo.find();
  if (!subs.length) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await repo.delete({ id: s.id });
        } else {
          console.error("Push send failed:", status, (err as Error).message);
        }
      }
    }),
  );
}

function money(cents: number, symbol: string): string {
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/**
 * New-order push for admins. Mirrors the Slack alert — fire-and-forget, never
 * blocks checkout.
 */
export async function sendNewOrderPush(order: Order, settings: SiteSettings): Promise<void> {
  const symbol = settings.currencySymbol || "$";
  const units = order.items.reduce((a, i) => a + i.quantity, 0);
  await sendAdminPush({
    title: `🛒 New order ${order.number}`,
    body: `${order.customerName} · ${units} item${units === 1 ? "" : "s"} · ${money(order.totalCents, symbol)}`,
    url: `/orders/${order.id}`,
    tag: `order-${order.id}`,
  });
}

/**
 * New-review push for admins. Only fired for customer-submitted reviews
 * (the tokenized-link flow in POST /orders/:number/review) — not for
 * reviews an admin creates directly, since that shouldn't self-notify.
 */
export async function sendNewReviewPush(review: Review): Promise<void> {
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  await sendAdminPush({
    title: `⭐ New review from ${review.customerName}`,
    body: review.comment.trim() ? `${stars} · ${review.comment.trim()}` : stars,
    url: `/reviews`,
    tag: `review-${review.id}`,
  });
}
