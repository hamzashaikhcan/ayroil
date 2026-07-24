import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDescription } from "@/components/product/product-description";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { fetchProductBySlug, fetchProductReviews, FALLBACK_PRODUCT } from "@/lib/server-api";
import { PRODUCT_RATING } from "@/consts";
import { fetchSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = (await fetchProductBySlug(slug)) ?? (slug === FALLBACK_PRODUCT.slug ? FALLBACK_PRODUCT : null);
  if (!product) return {};
  const ogImage = product.images?.[0];
  const title = product.metaTitle || product.name;
  return {
    // `absolute` bypasses the root layout's title template so the admin-set
    // metaTitle renders exactly as stored — no auto-appended site name suffix.
    title: { absolute: title },
    description: product.shortDescription,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description: product.shortDescription,
      url: `/shop/${product.slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.shortDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PDP(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const [product, reviews, settings, headerList] = await Promise.all([
    fetchProductBySlug(slug).then((p) => p ?? (slug === FALLBACK_PRODUCT.slug ? FALLBACK_PRODUCT : null)),
    fetchProductReviews(slug),
    fetchSettings(),
    headers(),
  ]);
  if (!product) notFound();

  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("host") ?? settings.domain;
  const origin = `${proto}://${host}`;
  const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`);

  const productUrl = absolute(`/shop/${product.slug}`);
  // image is a required Merchant-listings field — always emit at least the brand OG image as a fallback.
  const productImages = (product.images?.length ? product.images : [settings.ogImageUrl]).map(absolute);

  // Standard shipping window comes from settings as a range string like "3–5"; parse min/max for transit time.
  const dayMatches = settings.estStandardDays.match(/\d+/g);
  const minTransitDays = dayMatches?.[0] ? Number(dayMatches[0]) : undefined;
  const maxTransitDays = dayMatches?.[1] ? Number(dayMatches[1]) : minTransitDays;

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
    image: productImages,
    brand: { "@type": "Brand", name: settings.siteName },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: settings.currencyCode,
      price: (product.priceCents / 100).toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: settings.returnsWindowDays,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value:
            settings.freeShippingEnabled || product.priceCents >= settings.freeShippingThresholdCents
              ? "0.00"
              : (settings.standardShippingCents / 100).toFixed(2),
          currency: settings.currencyCode,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "PK",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: minTransitDays ?? 3,
            maxValue: maxTransitDays ?? 5,
            unitCode: "DAY",
          },
        },
      },
    },
    aggregateRating: reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: PRODUCT_RATING.value,
          bestRating: PRODUCT_RATING.best,
          reviewCount,
        }
      : undefined,
    review: reviews.slice(0, 10).map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.customerName },
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
      { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absolute("/shop") },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
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
                <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
                  {product.recommended ? (
                    <Badge tone="recommend">
                      <span className="text-accent">★</span> Recommended
                    </Badge>
                  ) : null}
                  <Badge tone={product.stock > 0 ? "accent" : "soft"}>{product.stock > 0 ? "In stock" : "Sold out"}</Badge>
                </div>
              </div>
            </div>

            <div>
              <ProductPurchasePanel
                product={product}
                estimatedShippingDays={settings.estStandardDays}
                sentinelId="pdp-buy-block"
                timer={{
                  enabled: settings.productTimerEnabled,
                  durationSeconds: settings.productTimerDurationSeconds,
                  discountPercent: settings.productTimerDiscountPercent,
                  message: settings.productTimerMessage,
                  storageKey: `${product.id}:${settings.productTimerDurationSeconds}:${settings.productTimerDiscountPercent}:${settings.productTimerMessage}`,
                }}
              >
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
              </ProductPurchasePanel>

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
                      <div className="font-display text-lg text-ink">{review.customerName}</div>
                      <div className="mt-1 text-xs text-muted">
                        {formatDate(review.createdAt)}
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
