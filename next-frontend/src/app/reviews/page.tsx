import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { fetchReviews } from "@/lib/server-api";
import { fetchSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const title = `Customer Reviews — ${settings.siteName}`;
  const description = `Real, verified reviews from ${settings.siteName} customers — unedited, including the critical ones.`;
  return {
    title,
    description,
    alternates: { canonical: "/reviews" },
    openGraph: { title, description, url: "/reviews", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`size-4 fill-current ${i < rating ? "text-accent-deep" : "text-line"}`}
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const [reviews, settings] = await Promise.all([fetchReviews(), fetchSettings()]);
  const reviewCount = reviews.length;
  const averageRating = reviewCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  const ld = reviewCount
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: settings.siteName,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: averageRating.toFixed(1),
          reviewCount,
        },
        review: reviews.slice(0, 50).map((r) => ({
          "@type": "Review",
          reviewRating: { "@type": "Rating", ratingValue: r.rating },
          author: { "@type": "Person", name: r.customerName },
          reviewBody: r.comment,
          datePublished: r.createdAt,
        })),
      }
    : null;

  return (
    <>
      {ld ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ) : null}

      <section className="border-b border-line bg-surface py-16">
        <Container>
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">From customers</span>
            </div>
            <h1 className="font-display mt-4 text-4xl tracking-tight text-ink md:text-5xl">
              Customer reviews
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted">
              We do not pay for reviews and we do not delete the bad ones. Every review here comes from a
              verified, delivered order.
            </p>
            {reviewCount ? (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-line bg-background px-5 py-4">
                <StarRating rating={Math.round(averageRating)} />
                <div>
                  <div className="font-display text-2xl leading-none text-ink">{averageRating.toFixed(1)}</div>
                  <div className="mt-1 text-xs text-muted">
                    {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {reviewCount ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-line bg-surface p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-display text-lg text-ink">{review.customerName}</div>
                      <div className="mt-1 text-xs text-muted">{formatDate(review.createdAt)}</div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment.trim() ? (
                    <p className="mt-4 text-sm leading-relaxed text-muted">{review.comment}</p>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-muted">Rated {review.rating} out of 5.</p>
                  )}
                  {review.images?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.images.map((url, i) => (
                        <div
                          key={url}
                          className="relative h-20 w-20 flex-none overflow-hidden rounded-lg border border-line bg-background"
                        >
                          <Image
                            src={url}
                            alt={`${review.customerName}'s photo ${i + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No reviews yet.</p>
          )}
        </Container>
      </section>
    </>
  );
}
