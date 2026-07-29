import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { RatingField } from "./rating-field";
import { ReviewImages } from "./review-images";

type ReviewLookup = {
  number: string;
  customerName: string;
  items: Array<{
    productName: string;
    slug: string | null;
    image: string | null;
  }>;
};

type SearchParams = {
  token?: string;
  submitted?: string;
  error?: string;
};

export async function generateMetadata(props: PageProps<"/orders/[number]/review">): Promise<Metadata> {
  const { number } = await props.params;
  return {
    title: "Leave a review",
    alternates: { canonical: `/orders/${number}/review` },
    robots: { index: false, follow: false },
  };
}

async function fetchReview(number: string, token: string): Promise<ReviewLookup | null> {
  try {
    const url = `${API_URL}/orders/${encodeURIComponent(number)}/review?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ReviewLookup;
  } catch {
    return null;
  }
}

async function submitReview(number: string, formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  const images = formData.getAll("images").map(String).filter(Boolean);

  const res = await fetch(`${API_URL}/orders/${encodeURIComponent(number)}/review`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, rating, comment, images }),
  });

  if (res.ok) {
    redirect(`/orders/${encodeURIComponent(number)}/review?submitted=1`);
  }

  const reason = res.status === 410 ? "expired" : "failed";
  redirect(
    `/orders/${encodeURIComponent(number)}/review?token=${encodeURIComponent(token)}&error=${reason}`,
  );
}

export default async function OrderReviewPage(props: PageProps<"/orders/[number]/review">) {
  const { number } = await props.params;
  const searchParams = (await props.searchParams) as SearchParams;

  if (searchParams.submitted === "1") {
    return (
      <section className="bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)] py-20">
        <Container>
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-background p-10 shadow-sm">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">Review received</span>
            </div>
            <h1 className="font-display mt-4 text-4xl tracking-tight text-ink">Thank you.</h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              Your review for order {number} has been saved. We appreciate you taking a minute to share how it went.
            </p>
            <Button href="/shop" variant="primary" className="mt-6">
              Back to shop
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  const token = searchParams.token ?? "";
  const review = token ? await fetchReview(number, token) : null;

  if (!review) {
    return (
      <section className="bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)] py-20">
        <Container>
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-background p-10 shadow-sm">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">Review unavailable</span>
            </div>
            <h1 className="font-display mt-4 text-4xl tracking-tight text-ink">This link is no longer active.</h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              Review links are single-use and only work after an order has been delivered. If you need help, contact us
              with order {number}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/contact" variant="primary">
                Contact support
              </Button>
              <Button href="/shop" variant="secondary">
                Back to shop
              </Button>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const action = submitReview.bind(null, number);
  const firstName = review.customerName.trim().split(/\s+/)[0] || "there";

  return (
    <section className="bg-[linear-gradient(180deg,var(--background)_0%,var(--surface)_100%)] py-12 sm:py-20">
      <Container>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <aside className="rounded-2xl border border-line bg-background p-6 shadow-sm sm:p-7">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">Delivered order</span>
            </div>
            <h2 className="font-display mt-4 text-3xl tracking-tight text-ink">Order {review.number}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Thanks for choosing us, {firstName}. Your review will be tied to the items from this delivered order.
            </p>

            <div className="mt-7 space-y-3">
              {review.items.map((item, index) => (
                <div key={`${item.productName}-${index}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted">Item</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {item.slug ? (
                      <Link href={`/shop/${item.slug}`} className="block truncate text-sm font-medium text-ink hover:underline underline-offset-4">
                        {item.productName}
                      </Link>
                    ) : (
                      <div className="truncate text-sm font-medium text-ink">{item.productName}</div>
                    )}
                    <div className="mt-0.5 text-xs text-muted">Ready for your review</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="rounded-2xl border border-line bg-background p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="marker-dot">Leave a review</span>
            </div>
            <h1 className="font-display mt-4 text-4xl tracking-tight text-ink sm:text-5xl">
              How was it, {firstName}?
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              A quick note and star rating help other customers decide with confidence.
            </p>

            {searchParams.error ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {searchParams.error === "expired"
                  ? "This review link has already been used or is no longer valid."
                  : "We could not save your review. Please try again."}
              </div>
            ) : null}

            <form action={action} className="mt-8 space-y-7">
              <input type="hidden" name="token" value={token} />
              <RatingField />

              <div>
                <label htmlFor="comment" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  Comment
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={5}
                  maxLength={1000}
                  placeholder="What did you like? Anything we should improve?"
                  className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted hover:border-line-strong focus:border-ink/30 focus:outline-none"
                />
              </div>

              <ReviewImages number={number} token={token} />

              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
                <Button type="submit" variant="primary">
                  Submit review
                </Button>
                <p className="text-xs text-muted">This one-time link closes after submission.</p>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}
