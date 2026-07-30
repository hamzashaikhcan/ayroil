import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductDescription } from "@/components/product/product-description";
import { API_URL } from "@/lib/api";
import { fetchSettings } from "@/lib/settings";
import { formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUS } from "@consts";

type OrderDetail = {
  number: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customerName: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone?: string | null;
  };
  trackingNumber: string | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
    slug: string | null;
    image: string | null;
  }>;
};

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: ORDER_STATUS.PENDING, label: "Order placed" },
  { key: ORDER_STATUS.FULFILLED, label: "Preparing" },
  { key: ORDER_STATUS.SHIPPED, label: "Shipped" },
  { key: ORDER_STATUS.DELIVERED, label: "Delivered" },
];

function trackingUrl(trackingNumber: string): string {
  return `https://merchantapi.leopardscourier.com/track?no=${encodeURIComponent(trackingNumber)}`;
}

// Same number the floating WhatsApp button uses (src/components/layout/whatsapp-button.tsx).
const WHATSAPP_NUMBER = "923091238888";

function whatsappHelpUrl(orderNumber: string): string {
  const text = `I need help with my order ${orderNumber}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export async function generateMetadata(props: PageProps<"/orders/[number]">): Promise<Metadata> {
  const { number } = await props.params;
  return {
    title: "Order details",
    alternates: { canonical: `/orders/${number}` },
    robots: { index: false, follow: false },
  };
}

async function fetchOrder(number: string): Promise<OrderDetail | null> {
  try {
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(number)}/detail`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OrderDetail;
  } catch {
    return null;
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function OrderDetailPage(props: PageProps<"/orders/[number]">) {
  const { number } = await props.params;
  const [order, settings] = await Promise.all([fetchOrder(number), fetchSettings()]);

  if (!order) {
    return (
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-10 text-center">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">Order not found</span>
            </div>
            <h1 className="font-display mt-4 text-3xl tracking-tight text-ink">We couldn&apos;t find that order.</h1>
            <p className="mt-4 text-sm text-muted">
              Double-check the link from your confirmation email, or contact us if you think this is a mistake.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/contact" variant="primary">Contact support</Button>
              <Button href="/shop" variant="secondary">Back to shop</Button>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const addr = order.shippingAddress;
  const isPending = order.status === ORDER_STATUS.PENDING;
  const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <section className="bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)] py-12 sm:py-20">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Order confirmed</span>
          </div>
          <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl">
            Thanks, {order.customerName.split(" ")[0]}.
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-background/60 px-4 py-3 text-sm">
            <span className="text-muted">
              Order <span className="font-mono font-medium text-ink">{order.number}</span>
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-line-strong sm:inline-block" />
            <span className="text-muted">
              {formatDate(order.createdAt, { year: "numeric", month: "long", day: "numeric" })}
            </span>
            {isPending ? null : (
              <Badge tone={isCancelled ? "outline" : "accent"} className="ml-auto">
                {capitalize(order.status)}
              </Badge>
            )}
          </div>

          {/* Shipment status */}
          <div className="mt-6 rounded-2xl border border-line bg-background p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg tracking-tight text-ink">Shipment status</h2>

            {isCancelled ? (
              <div className="mt-5 flex items-center gap-3 rounded-lg bg-bad/8 px-4 py-3">
                <span className="inline-block h-2.5 w-2.5 flex-none rounded-full bg-bad" />
                <span className="text-sm font-medium text-ink">
                  This order was {order.status === ORDER_STATUS.CANCELLED ? "cancelled" : "refunded"}.
                </span>
              </div>
            ) : (
              <ol className="mt-7 flex items-start">
                {STATUS_STEPS.map((step, i) => {
                  const done = currentStepIndex > i;
                  const current = currentStepIndex === i;
                  const reached = currentStepIndex >= i;
                  const last = i === STATUS_STEPS.length - 1;
                  return (
                    <li key={step.key} className={`flex items-start ${last ? "" : "flex-1"}`}>
                      <div className="flex flex-col items-center">
                        <div className="relative flex h-8 w-8 flex-none items-center justify-center">
                          {current ? (
                            <span className="absolute inset-0 animate-ping rounded-full bg-green-500/60" aria-hidden />
                          ) : null}
                          <div
                            className={`relative flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 text-xs font-semibold ${
                              done
                                ? "border-green-600 bg-green-600 text-white"
                                : current
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-line-strong bg-background text-muted"
                            }`}
                          >
                            {done ? (
                              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M4 10.5 8 14.5 16 6" />
                              </svg>
                            ) : (
                              i + 1
                            )}
                          </div>
                        </div>
                        <span className={`mt-2.5 whitespace-nowrap text-xs font-medium ${reached ? "text-ink" : "text-muted"}`}>
                          {step.label}
                        </span>
                      </div>
                      {!last ? (
                        <div className={`mt-4 h-0.5 flex-1 ${done ? "bg-green-600" : "bg-line"}`} aria-hidden />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}

            {order.trackingNumber ? (
              <div className="mt-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
                <span className="text-muted">Tracking number</span>
                <span className="font-mono text-ink">{order.trackingNumber}</span>
                <a
                  href={trackingUrl(order.trackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto font-medium text-ink underline underline-offset-4 hover:text-accent-deep"
                >
                  Track package →
                </a>
              </div>
            ) : null}
          </div>

          {settings.orderNote?.trim() ? (
            <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
              <ProductDescription html={settings.orderNote} className="text-sm" />
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            {/* Items */}
            <div className="rounded-2xl border border-line bg-background p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl tracking-tight text-ink">What you ordered</h2>
              <div className="mt-5 divide-y divide-line">
                {order.items.map((item, index) => (
                  <div key={`${item.productName}-${index}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted">Item</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.slug ? (
                        <Link
                          href={`/shop/${item.slug}`}
                          className="block truncate text-sm font-medium text-ink hover:underline underline-offset-4"
                        >
                          {item.productName}
                        </Link>
                      ) : (
                        <div className="truncate text-sm font-medium text-ink">{item.productName}</div>
                      )}
                      <div className="mt-0.5 text-xs text-muted">Qty {item.quantity}</div>
                    </div>
                    <div className="font-mono text-sm text-ink">{formatPrice(item.unitPriceCents * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shippingCents)}</span>
                </div>
                {order.taxCents ? (
                  <div className="flex justify-between text-muted">
                    <span>Tax</span>
                    <span>{formatPrice(order.taxCents)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-line pt-2 font-display text-base text-ink">
                  <span>Total</span>
                  <span>{formatPrice(order.totalCents)}</span>
                </div>
              </div>
            </div>

            {/* Shipping / payment */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-background p-6 shadow-sm">
                <h2 className="font-display text-lg tracking-tight text-ink">Shipping to</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {addr.fullName}
                  <br />
                  {addr.line1}
                  {addr.line2 ? <>, {addr.line2}</> : null}
                  <br />
                  {addr.city}, {addr.region} {addr.postalCode}
                  <br />
                  {addr.country}
                  {addr.phone ? (
                    <>
                      <br />
                      {addr.phone}
                    </>
                  ) : null}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-background p-6 shadow-sm">
                <h2 className="font-display text-lg tracking-tight text-ink">Payment</h2>
                <Badge tone="soft" className="mt-3">COD (Cash on Delivery)</Badge>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/shop" variant="secondary">Continue shopping</Button>
            <Button href={whatsappHelpUrl(order.number)} target="_blank" rel="noopener noreferrer" variant="secondary">
              Need help?
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
