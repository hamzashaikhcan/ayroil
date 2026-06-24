import { getActiveCurrencyCode } from "@/lib/utils";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", eventName, params);
  window.fbq?.("track", eventName, params);
}

type TrackedItem = { id: string; name: string; priceCents: number; quantity?: number };

function toContents(items: TrackedItem[]) {
  return items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 }));
}

function toValue(items: TrackedItem[]) {
  return items.reduce((sum, i) => sum + i.priceCents * (i.quantity ?? 1), 0) / 100;
}

export function trackViewContent(product: { id: string; name: string; priceCents: number }) {
  track("ViewContent", {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    value: product.priceCents / 100,
    currency: getActiveCurrencyCode(),
  });
}

export function trackAddToCart(item: TrackedItem) {
  track("AddToCart", {
    content_name: item.name,
    content_ids: [item.id],
    contents: toContents([item]),
    content_type: "product",
    value: toValue([item]),
    currency: getActiveCurrencyCode(),
  });
}

export function trackInitiateCheckout(items: TrackedItem[]) {
  track("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    contents: toContents(items),
    content_type: "product",
    num_items: items.reduce((sum, i) => sum + (i.quantity ?? 1), 0),
    value: toValue(items),
    currency: getActiveCurrencyCode(),
  });
}

export function trackPurchase(items: TrackedItem[], totalCents: number, orderNumber: string) {
  track("Purchase", {
    content_ids: items.map((i) => i.id),
    contents: toContents(items),
    content_type: "product",
    value: totalCents / 100,
    currency: getActiveCurrencyCode(),
    order_id: orderNumber,
  });
}

export function trackCompleteRegistration() {
  track("CompleteRegistration");
}
