import { Resend } from "resend";
import { SITE } from "@consts";
import type { Order } from "../entities/Order.js";
import type { SiteSettings } from "../entities/SiteSettings.js";

function money(cents: number, symbol: string): string {
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function renderOrderEmailHtml(order: Order, settings: SiteSettings): string {
  const symbol = settings.currencySymbol || "$";
  const siteName = settings.siteName || SITE.siteName;
  const addr = order.shippingAddress;

  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;color:#111111;font-size:14px;">${i.productName} &times; ${i.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#111111;font-size:14px;">${money(i.unitPriceCents * i.quantity, symbol)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111111;">
      <h1 style="font-size:20px;margin:0 0 4px;">Thanks for your order, ${order.customerName.split(" ")[0]}.</h1>
      <p style="color:#555555;font-size:14px;margin:0 0 24px;">Order ${order.number} is confirmed.</p>

      <table style="width:100%;border-collapse:collapse;">
        ${rows}
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid #e5e5e5;color:#555555;font-size:14px;">Subtotal</td>
          <td style="padding:12px 0 0;border-top:1px solid #e5e5e5;text-align:right;font-size:14px;">${money(order.subtotalCents, symbol)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555555;font-size:14px;">Shipping</td>
          <td style="padding:4px 0;text-align:right;font-size:14px;">${money(order.shippingCents, symbol)}</td>
        </tr>
        ${
          order.taxCents
            ? `<tr>
          <td style="padding:4px 0;color:#555555;font-size:14px;">Tax</td>
          <td style="padding:4px 0;text-align:right;font-size:14px;">${money(order.taxCents, symbol)}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding:8px 0;font-weight:600;font-size:14px;">Total</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;font-size:14px;">${money(order.totalCents, symbol)}</td>
        </tr>
      </table>

      <p style="margin-top:24px;color:#555555;font-size:13px;line-height:1.5;">
        Shipping to ${addr.fullName}, ${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}, ${addr.city}, ${addr.region} ${addr.postalCode}, ${addr.country}.
      </p>

      <p style="margin-top:24px;color:#999999;font-size:12px;">${siteName}</p>
    </div>
  `;
}

/**
 * Fire-and-forget order confirmation email. Resend credentials are
 * admin-configurable (Settings → Email), not env vars, so we read them off
 * the settings row passed in rather than process.env. Never throws — a
 * misconfigured or down email provider must not fail checkout.
 */
export async function sendOrderConfirmationEmail(order: Order, settings: SiteSettings): Promise<void> {
  const apiKey = settings.resendApiKey?.trim();
  const from = settings.resendFromEmail?.trim();
  if (!apiKey || !from) {
    console.warn("[email] Resend not configured (missing API key or from email) — skipping order confirmation email.");
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: order.email,
      subject: `Order confirmed — ${order.number}`,
      html: renderOrderEmailHtml(order, settings),
    });
    if (error) console.error("[email] Resend rejected the order confirmation email:", error);
  } catch (err) {
    console.error("[email] Failed to send order confirmation email:", err);
  }
}
