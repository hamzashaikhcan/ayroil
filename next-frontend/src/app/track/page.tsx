import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";
import { fetchSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS } from "@consts";

type TrackResult = {
  found: boolean;
  orderNumber: string | null;
  orderStatus: string | null;
  trackingNumber: string | null;
  courier: "postex" | null;
  status: string | null;
  cityName: string | null;
  transactionDate: string | null;
  history: { message: string; code: string }[];
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = "Track Your Order — Delivery Status Lookup";
  const description = `Enter your ${settings.siteName} order number or courier tracking number to see the latest delivery status, right here — no need to visit a courier's site.`;
  return {
    title,
    description,
    alternates: { canonical: "/track" },
    openGraph: { title: `${title} · ${settings.siteName}`, description, url: "/track", type: "website" },
    twitter: { card: "summary_large_image", title: `${title} · ${settings.siteName}`, description },
  };
}

async function fetchTracking(query: string): Promise<TrackResult | { error: string } | null> {
  try {
    const res = await fetch(`${API_URL}/track?query=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return { error: typeof data?.error === "string" ? data.error : "We couldn't find that order or tracking number." };
    return data as TrackResult;
  } catch {
    return { error: "Tracking is temporarily unavailable. Please try again shortly." };
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function TrackPage(props: PageProps<"/track">) {
  const sp = await props.searchParams;
  const query = typeof sp.query === "string" ? sp.query.trim() : "";
  const result = query ? await fetchTracking(query) : null;
  const error = result && "error" in result ? result.error : null;
  const data = result && !("error" in result) ? result : null;

  return (
    <section className="bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)] py-12 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Track your order</span>
          </div>
          <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl">
            Where&apos;s my order?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Enter your order number (from your confirmation email) or courier tracking number below.
          </p>

          <form action="/track" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="e.g. PO-XXXXXXXX or your tracking number"
              className="h-12 w-full min-w-0 flex-1 rounded-lg border border-line-strong bg-background px-4 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            />
            <Button type="submit" size="lg">
              Track
            </Button>
          </form>

          {error ? (
            <div className="mt-8 rounded-2xl border border-line bg-background p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-ink">{error}</p>
              <p className="mt-2 text-sm text-muted">
                Double-check what you entered, or{" "}
                <Link href="/contact" className="underline underline-offset-4 hover:text-ink">
                  contact support
                </Link>{" "}
                if you need help.
              </p>
            </div>
          ) : null}

          {data ? (
            <div className="mt-8 rounded-2xl border border-line bg-background p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {data.orderNumber ? (
                  <span className="text-sm text-muted">
                    Order <span className="font-mono font-medium text-ink">{data.orderNumber}</span>
                  </span>
                ) : null}
                {data.trackingNumber ? (
                  <span className="text-sm text-muted">
                    Tracking <span className="font-mono font-medium text-ink">{data.trackingNumber}</span>
                  </span>
                ) : null}
                <Badge tone="accent" className="ml-auto">
                  {data.status
                    ? capitalize(data.status)
                    : data.orderStatus
                      ? capitalize(data.orderStatus)
                      : "Pending"}
                </Badge>
              </div>

              {data.courier === "postex" ? (
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                  Courier: PostEx{data.cityName ? ` · ${data.cityName}` : ""}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  {data.orderStatus === ORDER_STATUS.CANCELLED || data.orderStatus === ORDER_STATUS.REFUNDED
                    ? "This order won't be shipped."
                    : "This order hasn't been booked with a courier yet — check back soon."}
                </p>
              )}

              {data.history.length > 0 ? (
                <ol className="mt-6 space-y-4 border-t border-line pt-6">
                  {data.history.map((h, i) => (
                    <li key={`${h.code}-${i}`} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent" aria-hidden />
                      <span className="text-sm text-ink">{h.message}</span>
                    </li>
                  ))}
                </ol>
              ) : null}

              {data.transactionDate ? (
                <p className="mt-6 text-xs text-muted">Last updated {formatDate(data.transactionDate)}</p>
              ) : null}

              {data.orderNumber ? (
                <div className="mt-6 border-t border-line pt-6">
                  <Button href={`/orders/${data.orderNumber}`} variant="secondary" size="sm">
                    View full order details
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
