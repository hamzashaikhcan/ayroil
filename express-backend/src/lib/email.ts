import { Resend } from "resend";
import { SITE } from "@consts";
import type { Order } from "../entities/Order.js";
import type { SiteSettings } from "../entities/SiteSettings.js";

function money(cents: number, symbol: string): string {
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/** Public storefront origin used to build links inside emails. */
function siteBaseUrl(settings: SiteSettings): string {
  return settings.domain ? `https://${settings.domain}` : SITE.storefrontUrl;
}

function productUrl(settings: SiteSettings, slug: string): string {
  return `${siteBaseUrl(settings)}/shop/${slug}`;
}

/** Permanent, revisit-anytime order detail page — the order number is the credential (see newOrderNumber()). */
function orderUrl(settings: SiteSettings, order: Order): string {
  return `${siteBaseUrl(settings)}/orders/${order.number}`;
}

/**
 * A real CTA button. Plain <a> buttons render inconsistently across email
 * clients (Outlook in particular), so this uses the table-cell trick —
 * a single-cell table whose cell is the clickable, colored surface.
 */
function emailButton(label: string, href: string, settings: SiteSettings): string {
  const accent = settings.brand?.accentHex || "#0a0a0b";
  const accentInk = settings.brand?.accentInkHex || "#ffffff";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td bgcolor="${accent}" style="border-radius:8px;">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:13px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${accentInk};text-decoration:none;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Order line items as a table. Each product name links to its live PDP
 * (and shows a thumbnail) when the product still exists; falls back to
 * plain text if it was deleted since the order was placed.
 */
function renderOrderItemsTable(order: Order, settings: SiteSettings): string {
  const symbol = settings.currencySymbol || "$";
  const rows = order.items
    .map((i) => {
      const image = i.product?.images?.[0];
      const nameHtml = i.product
        ? `<a href="${productUrl(settings, i.product.slug)}" target="_blank" style="color:#111111;text-decoration:none;font-weight:500;">${i.productName}</a>`
        : `<span style="color:#111111;font-weight:500;">${i.productName}</span>`;
      const thumb = image
        ? `<img src="${image}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:6px;object-fit:cover;background:#f4f4f4;" />`
        : `<div style="width:48px;height:48px;border-radius:6px;background:#f4f4f4;"></div>`;
      return `
        <tr>
          <td style="padding:10px 0;width:48px;">${thumb}</td>
          <td style="padding:10px 0 10px 12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;">
            ${nameHtml}<br/>
            <span style="color:#888888;font-size:12.5px;">Qty ${i.quantity}</span>
          </td>
          <td style="padding:10px 0;text-align:right;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#111111;white-space:nowrap;">
            ${money(i.unitPriceCents * i.quantity, symbol)}
          </td>
        </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
}

/**
 * Shared header/footer chrome for every transactional email — logo + site
 * name pulled live from SiteSettings (never hardcoded), a white content
 * card, and a footer with company/contact details. Inline styles + tables
 * only: this has to render correctly in email clients that ignore <style>
 * blocks and flex/grid entirely.
 */
function renderEmailLayout(settings: SiteSettings, bodyHtml: string): string {
  const siteName = settings.siteName || SITE.siteName;
  const logo = settings.iconUrl || settings.darkLogoUrl;
  const year = new Date().getFullYear();
  const footerLines = [settings.companyName || siteName, settings.supportEmail]
    .filter(Boolean)
    .join(" · ");

  return `
  <body style="margin:0;padding:0;background:#f4f3f1;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f1;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:92vw;">
            <tr>
              <td style="padding:0 4px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    ${logo ? `<td style="padding-right:10px;"><img src="${logo}" width="28" height="28" alt="${siteName}" style="display:block;width:28px;height:28px;border-radius:6px;" /></td>` : ""}
                    <td style="font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#111111;letter-spacing:-0.01em;">
                      ${siteName}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:14px;padding:32px 28px;box-shadow:0 1px 2px rgba(17,17,17,0.06);">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 4px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9a9a96;text-align:center;">
                ${footerLines ? `${footerLines}<br/>` : ""}
                &copy; ${year} ${siteName}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>`;
}

function renderOrderConfirmationBody(order: Order, settings: SiteSettings): string {
  const symbol = settings.currencySymbol || "$";
  const addr = order.shippingAddress;

  return `
    <h1 style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:21px;color:#111111;">Thanks for your order, ${order.customerName.split(" ")[0]}.</h1>
    <p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">Order <strong>${order.number}</strong> is confirmed and being prepared.</p>

    ${renderOrderItemsTable(order, settings)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ececea;margin-top:14px;font-family:Helvetica,Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:12px 0 4px;color:#666666;">Subtotal</td><td style="padding:12px 0 4px;text-align:right;">${money(order.subtotalCents, symbol)}</td></tr>
      <tr><td style="padding:4px 0;color:#666666;">Shipping</td><td style="padding:4px 0;text-align:right;">${money(order.shippingCents, symbol)}</td></tr>
      ${
        order.taxCents
          ? `<tr><td style="padding:4px 0;color:#666666;">Tax</td><td style="padding:4px 0;text-align:right;">${money(order.taxCents, symbol)}</td></tr>`
          : ""
      }
      <tr><td style="padding:10px 0 0;font-weight:700;color:#111111;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;color:#111111;">${money(order.totalCents, symbol)}</td></tr>
    </table>

    <p style="margin-top:24px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#666666;">
      Shipping to ${addr.fullName}, ${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}, ${addr.city}, ${addr.region} ${addr.postalCode}, ${addr.country}.
    </p>

    ${emailButton("View order", orderUrl(settings, order), settings)}`;
}

function renderShippedBody(order: Order, settings: SiteSettings): string {
	const trackingNumber = order.trackingNumber?.trim();
	const trackingUrl = `https://pk.leopardscourier.com/shipment_tracking_view`;

	const trackingSection = trackingNumber
		? `<p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">Order <strong>${order.number}</strong> has shipped via Leopards Courier.</p>
    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">Tracking number: <strong style="color:#111111;">${trackingNumber}</strong></p>

    ${emailButton('Track your package', trackingUrl, settings)}`
		: `<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">Order <strong>${order.number}</strong> has shipped and is on its way to you.</p>`;

	return `
    <h1 style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:21px;color:#111111;">Your order is on its way, ${order.customerName.split(' ')[0]}.</h1>
    ${trackingSection}

    ${renderOrderItemsTable(order, settings)}

    ${emailButton("View order", orderUrl(settings, order), settings)}`;
}

function renderDeliveredReviewBody(order: Order, settings: SiteSettings, reviewUrl: string): string {
  return `
    <h1 style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:21px;color:#111111;">Your order has arrived, ${order.customerName.split(" ")[0]}.</h1>
    <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">We hope you're happy with order <strong>${order.number}</strong>. Mind leaving a quick review?</p>
    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">It takes under a minute and helps other customers a lot.</p>

    ${emailButton("Leave a review", reviewUrl, settings)}

    ${renderOrderItemsTable(order, settings)}

    <p style="margin-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#999999;">
      This review link can only be used once. <a href="${orderUrl(settings, order)}" style="color:#666666;">View your order</a> any time.
    </p>`;
}

async function sendEmail(order: Order, settings: SiteSettings, subject: string, bodyHtml: string): Promise<void> {
  const apiKey = settings.resendApiKey?.trim();
  const from = settings.resendFromEmail?.trim();
  if (!apiKey || !from) {
    console.warn(`[email] Resend not configured (missing API key or from email) — skipping "${subject}" email.`);
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: order.email,
      subject,
      html: `<!doctype html><html><head><meta charset="utf-8" /></head>${renderEmailLayout(settings, bodyHtml)}</html>`,
    });
    if (error) console.error(`[email] Resend rejected "${subject}":`, error);
  } catch (err) {
    console.error(`[email] Failed to send "${subject}":`, err);
  }
}

/**
 * Fire-and-forget order confirmation email. Resend credentials are
 * admin-configurable (Settings → Email), not env vars, so we read them off
 * the settings row passed in rather than process.env. Never throws — a
 * misconfigured or down email provider must not fail checkout.
 */
export async function sendOrderConfirmationEmail(order: Order, settings: SiteSettings): Promise<void> {
  await sendEmail(order, settings, `Order confirmed — ${order.number}`, renderOrderConfirmationBody(order, settings));
}

/** Fire-and-forget "your order shipped" email. Includes a Leopards tracking link/number only if order.trackingNumber is set. */
export async function sendShippedOrderEmail(order: Order, settings: SiteSettings): Promise<void> {
  await sendEmail(order, settings, `Order shipped — ${order.number}`, renderShippedBody(order, settings));
}

/** Fire-and-forget "your order was delivered, please review" email with a one-time review link. */
export async function sendDeliveredReviewEmail(order: Order, settings: SiteSettings, reviewToken: string): Promise<void> {
  const reviewUrl = `${siteBaseUrl(settings)}/orders/${order.number}/review?token=${reviewToken}`;
  await sendEmail(order, settings, `How was your order, ${order.customerName.split(" ")[0]}?`, renderDeliveredReviewBody(order, settings, reviewUrl));
}
