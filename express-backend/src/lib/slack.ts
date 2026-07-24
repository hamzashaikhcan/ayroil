import { ENV } from "../config/env.js";
import type { Order } from "../entities/Order.js";
import type { SiteSettings } from "../entities/SiteSettings.js";

function money(cents: number, symbol: string): string {
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/**
 * Posts a new-order alert to Slack via chat.postMessage. Fire-and-forget —
 * never blocks or fails checkout if Slack is unreachable or unconfigured.
 */
export async function sendNewOrderSlackAlert(order: Order, settings: SiteSettings): Promise<void> {
  if (ENV.nodeEnv === "development") return;
  if (!ENV.slack.token || !ENV.slack.alertChannel) return;

  const symbol = settings.currencySymbol || "$";
  const itemLines = order.items
    .map((i) => `• ${i.quantity}× ${i.productName} — ${money(i.unitPriceCents * i.quantity, symbol)}`)
    .join("\n");

  const text = [
    `:tada: *New order ${order.number}*`,
    `*Customer:* ${order.customerName} (${order.email})${order.phone ? ` · ${order.phone}` : ""}`,
    `*Total:* ${money(order.totalCents, symbol)} (subtotal ${money(order.subtotalCents, symbol)}, shipping ${money(order.shippingCents, symbol)}, tax ${money(order.taxCents, symbol)})`,
    `*Items:*\n${itemLines}`,
    `*Ship to:* ${order.shippingAddress.line1}${order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, ${order.shippingAddress.city}, ${order.shippingAddress.region} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
  ].join("\n\n");

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${ENV.slack.token}`,
      },
      body: JSON.stringify({ channel: ENV.slack.alertChannel, text }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      console.error("Slack alert failed:", data.error);
    }
  } catch (err) {
    console.error("Slack alert failed:", err);
  }
}
