import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyBlock } from "@/components/product/buy-block";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { ProductDescription } from "@/components/product/product-description";
import { fetchProductBySlug, fetchProductReviews, FALLBACK_PRODUCT } from "@/lib/server-api";
import { fetchSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = (await fetchProductBySlug(slug)) ?? (slug === FALLBACK_PRODUCT.slug ? FALLBACK_PRODUCT : null);
  if (!product) return {};
  const ogImage = product.images?.[0];
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription,
      url: `/shop/${product.slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PDP(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const [product, reviews, settings] = await Promise.all([
    fetchProductBySlug(slug).then((p) => p ?? (slug === FALLBACK_PRODUCT.slug ? FALLBACK_PRODUCT : null)),
    fetchProductReviews(slug),
    fetchSettings(),
  ]);
  if (!product) notFound();

  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku ?? undefined,
    image: product.images?.length ? product.images : undefined,
    brand: { "@type": "Brand", name: settings.siteName },
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currencyCode,
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating: reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: averageRating.toFixed(1),
          reviewCount,
        }
      : undefined,
    review: reviews.slice(0, 10).map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: maskName(review.customerName) },
      datePublished: review.createdAt,
      reviewBody: review.comment || undefined,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
      { "@type": "ListItem", position: 3, name: product.name, item: `/shop/${product.slug}` },
    ],
  };

  const faqLd = product.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: product.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      ) : null}
      <section className="border-b border-line bg-surface">
        <Container className="py-8">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <Link href="/shop" className="hover:text-ink">Shop</Link>
            <span className="mx-2">·</span>
            <span>{product.name}</span>
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
            <div className="md:sticky md:top-24 md:self-start">
              <div className="relative">
                <ProductGallery
                  images={product.images ?? []}
                  slug={product.slug}
                  name={product.name}
                />
                <div className="pointer-events-none absolute left-3 top-3 z-10">
                  <Badge tone={product.stock > 0 ? "accent" : "soft"}>{product.stock > 0 ? "In stock" : "Sold out"}</Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                {settings.siteName}
              </div>
              <h1 className="font-display mt-4 text-4xl leading-tight tracking-tight text-ink md:text-5xl">{product.name}</h1>
              {product.tagline ? <p className="mt-2 text-base text-muted">{product.tagline}</p> : null}
              {reviewCount ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StarRating rating={averageRating} size="lg" />
                  <span className="text-sm font-medium text-ink">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted">
                    {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <div className="font-display text-3xl text-ink">{formatPrice(product.priceCents)}</div>
                {product.compareAtCents ? (
                  <div className="font-mono text-sm text-muted line-through">{formatPrice(product.compareAtCents)}</div>
                ) : null}
                <span className="ml-1">
                  <Badge tone={product.stock > 0 ? "accent" : "outline"}>
                    {product.stock > 0
                      ? product.stock < 10
                        ? `Only ${product.stock} left`
                        : `In stock · ships in ${settings.estStandardDays}d`
                      : "Sold out"}
                  </Badge>
                </span>
              </div>

              {/* Above-the-fold purchase block — qty + add to cart + buy now + free-ship hint */}
              <BuyBlock product={product} sentinelId="pdp-buy-block" />

              {/* Quick facts strip */}
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-line bg-surface p-5">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Ships</div>
                  <div className="font-display mt-2 text-xl text-ink">{settings.estStandardDays}d</div>
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Returns</div>
                  <div className="font-display mt-2 text-xl text-ink">{settings.returnsWindowDays}d</div>
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">SKU</div>
                  <div className="font-mono mt-2 text-sm text-ink">{product.sku ?? "—"}</div>
                </div>
              </div>

              {/* Highlights, then long description — pushed below the purchase area */}
              {product.highlights?.length ? (
                <ul className="mt-8 space-y-2 border-t border-line pt-6">
                  {product.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-sm text-ink">
                      <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                      {h}
                    </li>
                  ))}
                </ul>
              ) : null}

              <ProductDescription html={product.longDescription} className="mt-8" />
            </div>
          </div>
        </Container>
      </section>

      <StickyBuyBar product={product} sentinelId="pdp-buy-block" />

      {product.ingredients?.length ? (
        <section className="border-t border-line bg-surface py-16">
          <Container>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">What is inside</span></div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {product.ingredients.map((ing) => (
                <div key={ing.name} className="rounded-2xl border border-line bg-background p-6">
                  <div className="font-display text-xl text-ink">{ing.name}</div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{ing.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {reviews.length ? (
        <section className="border-t border-line py-16">
          <Container>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                  <span className="marker-dot">Reviews</span>
                </div>
                <h2 className="font-display mt-4 text-2xl tracking-tight text-ink">
                  What customers are saying
                </h2>
              </div>
              <div className="rounded-2xl border border-line bg-surface px-5 py-4">
                <div className="flex items-center gap-3">
                  <StarRating rating={averageRating} size="lg" />
                  <div>
                    <div className="font-display text-2xl leading-none text-ink">{averageRating.toFixed(1)}</div>
                    <div className="mt-1 text-xs text-muted">
                      {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-line bg-surface p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-display text-lg text-ink">{maskName(review.customerName)}</div>
                      <div className="mt-1 text-xs text-muted">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment.trim() ? (
                    <p className="mt-4 text-sm leading-relaxed text-muted">{review.comment}</p>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-muted">Rated {review.rating} out of 5.</p>
                  )}
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {product.faqs?.length ? (
        <section className="border-t border-line py-16">
          <Container>
            <div className="max-w-3xl">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                <span className="marker-dot">FAQ</span>
              </div>
              <h2 className="font-display mt-4 text-2xl tracking-tight text-ink">
                Frequently asked questions
              </h2>
            </div>
            <div className="mt-8 divide-y divide-line border-t border-line">
              {product.faqs.map((f, i) => (
                <article key={i} className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[1fr_2fr] md:gap-6">
                  <h3 className="font-display text-lg leading-snug text-ink">{f.q}</h3>
                  <p className="text-sm leading-relaxed text-muted">{f.a}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function maskName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  if (first.length <= 1) return first ? `${first}****` : "A****";
  return `${first[0]}${"*".repeat(Math.max(4, first.length - 2))}${first[first.length - 1]}`;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const rounded = Math.round(rating);
  const starClass = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <svg
          key={value}
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`${starClass} ${value <= rounded ? "text-amber-500" : "text-line-strong"}`}
          fill={value <= rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m10 2.5 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L2.5 8l5.2-.8L10 2.5Z" />
        </svg>
      ))}
    </div>
  );
}
