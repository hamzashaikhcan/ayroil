import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductThumb } from "@/components/product/product-thumb";
import { fetchAllProducts } from "@/lib/server-api";
import { fetchSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const description = "Browse everything we currently make. One product line at a time.";
  return {
    title: "Shop",
    description,
    alternates: { canonical: "/shop" },
    openGraph: {
      title: `Shop · ${settings.siteName}`,
      description,
      url: "/shop",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Shop · ${settings.siteName}`,
      description,
    },
  };
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const items = await fetchAllProducts(q || undefined);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="py-12 md:py-20">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">
              {items.length === 0
                ? q
                  ? "No matches"
                  : "Nothing on the shelf yet"
                : `${items.length} on the shelf`}
            </span>
          </div>
          <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl">The shop.</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            We only ever list what we believe in shipping today. When a new product earns the shelf, it shows up here.
          </p>
          {q ? (
            <div className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Filter: &ldquo;{q}&rdquo; ·{" "}
              <Link href="/shop" className="text-ink underline-offset-4 hover:underline">
                clear
              </Link>
            </div>
          ) : null}
        </Container>
      </section>

      <section className="py-12">
        <Container>
          {items.length === 0 ? (
            <EmptyState query={q} />
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
                  <div className="relative">
                    <ProductThumb
                      image={p.images?.[0]}
                      slug={p.slug}
                      name={p.name}
                      className="aspect-square transition-transform duration-500 group-hover:-translate-y-1"
                    />
                    {p.recommended ? (
                      <div className="pointer-events-none absolute left-3 top-3 z-10">
                        <Badge tone="recommend">★ Recommended</Badge>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-display text-base text-ink truncate">{p.name}</div>
                      {p.reviewCount ? (
                        <ProductRatingSummary
                          rating={p.averageRating ?? 0}
                          count={p.reviewCount}
                          className="mt-1"
                        />
                      ) : null}
                      <div className="mt-0.5 text-xs text-muted truncate">{p.tagline ?? p.shortDescription}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-ink">{formatPrice(p.priceCents)}</div>
                      {p.compareAtCents ? (
                        <div className="font-mono text-xs text-muted line-through">
                          {formatPrice(p.compareAtCents)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function ProductRatingSummary({
  rating,
  count,
  className,
}: {
  rating: number;
  count: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <StarRating rating={rating} />
      <span className="text-xs text-muted">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <svg
          key={value}
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${value <= rounded ? "text-amber-500" : "text-line-strong"}`}
          fill={value <= rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m10 2.5 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L2.5 8l5.2-.8L10 2.5Z" />
        </svg>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center sm:p-12">
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
        <span className="marker-dot">{query ? "No matches" : "Empty shelf"}</span>
      </div>
      <h2 className="font-display mt-3 text-2xl tracking-tight text-ink sm:text-3xl">
        {query ? <>Nothing matched &ldquo;{query}&rdquo;</> : "No products yet"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {query
          ? "Try a different keyword, or clear the search to see everything we currently make."
          : "No products have been published yet. Check back soon."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {query ? (
          <>
            <Button href="/shop" variant="primary">
              Clear search
            </Button>
            <Button href="/" variant="secondary">
              Back to home
            </Button>
          </>
        ) : (
          <Button href="/" variant="primary">
            Back to home
          </Button>
        )}
      </div>
    </div>
  );
}
