import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyBlock } from "@/components/product/buy-block";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { ProductDescription } from "@/components/product/product-description";
import { fetchProductBySlug, FALLBACK_PRODUCT } from "@/lib/server-api";
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
  const [product, settings] = await Promise.all([
    fetchProductBySlug(slug).then((p) => p ?? (slug === FALLBACK_PRODUCT.slug ? FALLBACK_PRODUCT : null)),
    fetchSettings(),
  ]);
  if (!product) notFound();

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
