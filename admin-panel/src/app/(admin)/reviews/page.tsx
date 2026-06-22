import Link from "next/link";
import { fetchReviews } from "@/lib/server-api";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { ReviewActions } from "./review-actions";

export default async function ReviewsPage(props: PageProps<"/reviews">) {
  const sp = await props.searchParams;
  const status = parseStatus(typeof sp.status === "string" ? sp.status : "all");
  const reviews = await fetchReviews(status);
  const pendingCount = status === "hidden" ? reviews.length : reviews.filter((r) => !r.visible).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reviews"
        subtitle={`${reviews.length} ${status === "all" ? "total" : status} reviews · ${pendingCount} pending approval`}
        actions={<ReviewFilters active={status} />}
      />

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Review</th>
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-b border-line last:border-b-0 align-top row-hover">
                    <td className="max-w-md px-5 py-4">
                      <StarRating rating={review.rating} />
                      <p className="mt-2 text-sm leading-relaxed text-ink">
                        {review.comment.trim() || "No written comment."}
                      </p>
                      {review.order ? (
                        <Link
                          href={`/orders/${review.order.id}`}
                          className="mt-2 inline-block font-mono text-xs text-accent hover:text-accent-deep"
                        >
                          Order {review.order.number}
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      {review.product ? (
                        <div>
                          <div className="font-medium text-ink">{review.product.name}</div>
                          <div className="font-mono text-xs text-muted">{review.product.slug}</div>
                        </div>
                      ) : (
                        <span className="text-muted">Deleted product</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink">{review.customerName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={review.visible ? "visible" : "hidden"} />
                    </td>
                    <td className="px-5 py-4 text-muted tabular-nums">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <ReviewActions
                        id={review.id}
                        visible={review.visible}
                        label={`${review.customerName} · ${review.product?.name ?? "deleted product"}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function parseStatus(value: string): "all" | "visible" | "hidden" {
  return value === "visible" || value === "hidden" ? value : "all";
}

function ReviewFilters({ active }: { active: "all" | "visible" | "hidden" }) {
  const items: Array<{ href: string; label: string; value: "all" | "visible" | "hidden" }> = [
    { href: "/reviews", label: "All", value: "all" },
    { href: "/reviews?status=hidden", label: "Pending", value: "hidden" },
    { href: "/reviews?status=visible", label: "Visible", value: "visible" },
  ];

  return (
    <div className="inline-flex rounded-md border border-line bg-surface p-1">
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          className={
            active === item.value
              ? "rounded px-2.5 py-1 text-xs font-medium text-ink bg-background shadow-sm"
              : "rounded px-2.5 py-1 text-xs font-medium text-muted hover:text-ink"
          }
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <svg
            key={value}
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-4 w-4 ${value <= rating ? "text-amber-500" : "text-line-strong"}`}
            fill={value <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m10 2.5 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L2.5 8l5.2-.8L10 2.5Z" />
          </svg>
        ))}
      </div>
      <span className="font-mono text-xs text-muted">{rating}/5</span>
    </div>
  );
}
