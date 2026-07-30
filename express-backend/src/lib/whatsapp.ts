import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { SITE } from "@consts";
import { ENV } from "../config/env.js";
import type { Order } from "../entities/Order.js";
import type { SiteSettings } from "../entities/SiteSettings.js";

function money(cents: number, symbol: string): string {
  return `${symbol} ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function formatAddress(order: Order): string {
  const a = order.shippingAddress;
  const lines = [a.line1, a.line2].filter(Boolean).join(", ");
  return `${lines}, ${a.city} ${a.postalCode}, ${a.region}, ${countryName(a.country)}.`;
}

/** "Product A, Product B" for the Product field — per-item quantities live in their own field. */
function formatProductNames(order: Order): string {
  return order.items.map((i) => i.productName).join(", ");
}

/** "2" for a single item, "2, 1" (aligned with formatProductNames) for multiple. */
function formatQuantities(order: Order): string {
  if (order.items.length === 1) return String(order.items[0].quantity);
  return order.items.map((i) => String(i.quantity)).join(", ");
}

const PAYMENT_METHOD_LABEL = "Cash on Delivery (COD)";

/**
 * The seven order-detail fields the Content Template's {{2}}..{{7}}
 * variables map to (name is {{1}}) — kept in one place so the template
 * mapping and the plain-text fallback below always agree.
 */
function buildConfirmationFields(order: Order, settings: SiteSettings) {
  const symbol = settings.currencySymbol || "Rs.";
  return {
    customerName: order.customerName,
    orderId: order.number,
    product: formatProductNames(order),
    quantity: formatQuantities(order),
    totalAmount: money(order.totalCents, symbol),
    paymentMethod: PAYMENT_METHOD_LABEL,
    address: formatAddress(order),
  };
}

/** Plain-text fallback used when no Content Template is configured. */
function buildConfirmationMessage(order: Order, settings: SiteSettings): string {
  const siteName = settings.siteName || SITE.siteName;
  const f = buildConfirmationFields(order, settings);

  return [
    `Assalam-o-Alaikum ${f.customerName},`,
    `Thank you for your order with ${siteName}. Your order has been confirmed successfully.`,
    `Order Details`,
    `• Order ID: ${f.orderId}`,
    `• Product: ${f.product}`,
    `• Quantity: ${f.quantity}`,
    `• Total Amount: ${f.totalAmount}`,
    `• Payment Method: ${f.paymentMethod}`,
    `• Address: ${f.address}`,
    `Your order is now being processed and will be dispatched soon. Once it has been shipped, we'll send you the tracking number so you can track your parcel.`,
    `If you have any questions or would like to make any changes to your order before it is dispatched, simply reply to this message or contact us.`,
    `Thank you for choosing ${siteName}. We look forward to helping you achieve healthier, stronger hair.`,
  ].join("\n");
}

/**
 * Normalizes a customer-entered phone number to Twilio's `whatsapp:+E164`
 * format. Falls back to WHATSAPP_DEFAULT_COUNTRY when the number has no
 * country code of its own (the common case for local numbers). Returns null
 * for anything that still doesn't parse as a valid number.
 */
function toWhatsappAddress(raw: string): string | null {
  const parsed = parsePhoneNumberFromString(raw, ENV.twilio.defaultCountry as CountryCode);
  if (!parsed || !parsed.isValid()) return null;
  return `whatsapp:${parsed.number}`;
}

function isConfigured(): boolean {
  return Boolean(
    ENV.twilio.accountSid &&
      ENV.twilio.authToken &&
      (ENV.twilio.whatsappFrom || ENV.twilio.messagingServiceSid),
  );
}

/**
 * Sends a WhatsApp order-confirmation message via Twilio. Fire-and-forget —
 * mirrors sendNewOrderSlackAlert: logs failures, never throws, never blocks
 * checkout. Skipped silently when Twilio isn't configured or the order has
 * no usable phone number.
 */
export async function sendOrderConfirmationWhatsapp(order: Order, settings: SiteSettings): Promise<void> {
  if (!isConfigured()) return;

  const rawPhone = order.phone || order.shippingAddress?.phone;
  if (!rawPhone) return;
  const to = toWhatsappAddress(rawPhone);
  if (!to) return;

  const body: Record<string, string> = {
    To: to,
    From: ENV.twilio.messagingServiceSid ? "" : `whatsapp:${ENV.twilio.whatsappFrom}`,
    MessagingServiceSid: ENV.twilio.messagingServiceSid || "",
  };
  if (!body.From) delete body.From;
  if (!body.MessagingServiceSid) delete body.MessagingServiceSid;

  // The Content Template's static copy is hardcoded on Twilio's side;
  // {{1}}..{{7}} map to name/orderId/product/quantity/total/paymentMethod/address.
  if (ENV.twilio.contentSid) {
    const f = buildConfirmationFields(order, settings);
    body.ContentSid = ENV.twilio.contentSid;
    body.ContentVariables = JSON.stringify({
      1: f.customerName,
      2: f.orderId,
      3: f.product,
      4: f.quantity,
      5: f.totalAmount,
      6: f.paymentMethod,
      7: f.address,
    });
  } else {
    body.Body = buildConfirmationMessage(order, settings);
  }

  try {
    const auth = Buffer.from(`${ENV.twilio.accountSid}:${ENV.twilio.authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilio.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams(body),
      },
    );
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Twilio WhatsApp send failed:", res.status, errBody);
    }
  } catch (err) {
    console.error("Twilio WhatsApp send failed:", err);
  }
}
