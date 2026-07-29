import Link from "next/link";
import Image from "next/image";
import { fetchProducts, fetchReviews } from "@/lib/server-api";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { AddReviewDialog, EditReviewDialog } from "./add-review-dialog";
import { ReviewActions } from "./review-actions";
import { formatDate } from "@/lib/utils";

export default async function ReviewsPage(props: PageProps<"/reviews">) {
  const sp = await props.searchParams;
  const status = parseStatus(typeof sp.status === "string" ? sp.status : "all");
  const requestedPage = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);
  const [list, products] = await Promise.all([fetchReviews(status, requestedPage), fetchProducts()]);
  const { items: reviews, total, page, pageCount } = list;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reviews"
        subtitle={`${total} ${status === "all" ? "total" : status} ${total === 1 ? "review" : "reviews"}${pageCount > 1 ? ` · page ${page} of ${pageCount}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <ReviewFilters active={status} />
            <AddReviewDialog products={products.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))} />
          </div>
        }
      />

      <div className="card table-card-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
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
                    <td className="td-block max-w-md px-5 py-4" data-label="Review">
                      <StarRating rating={review.rating} />
                      <p className="mt-2 text-sm leading-relaxed text-ink">
                        {review.comment.trim() || "No written comment."}
                      </p>
                      {review.images?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {review.images.map((url, i) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="relative block h-12 w-12 flex-none overflow-hidden rounded-md border border-line"
                            >
                              <Image src={url} alt={`Attachment ${i + 1}`} fill sizes="48px" className="object-cover" unoptimized />
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {review.order ? (
                        <Link
                          href={`/orders/${review.order.id}`}
                          className="mt-2 inline-block font-mono text-xs text-accent hover:text-accent-deep"
                        >
                          Order {review.order.number}
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-5 py-4" data-label="Product">
                      {review.product ? (
                        <div>
                          <div className="font-medium text-ink">{review.product.name}</div>
                          <div className="font-mono text-xs text-muted">{review.product.slug}</div>
                        </div>
                      ) : (
                        <span className="text-muted">Deleted product</span>
                      )}
                    </td>
                    <td className="px-5 py-4" data-label="Customer">
                      <div className="font-medium text-ink">{review.customerName}</div>
                    </td>
                    <td className="px-5 py-4" data-label="Status">
                      <StatusPill value={review.visible ? "visible" : "hidden"} />
                    </td>
                    <td className="px-5 py-4 text-muted tabular-nums" data-label="Date">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-5 py-4" data-label="Actions">
                      <div className="flex flex-wrap items-center gap-2">
                        <EditReviewDialog
                          review={{
                            id: review.id,
                            rating: review.rating,
                            comment: review.comment,
                            customerName: review.customerName,
                            visible: review.visible,
                            createdAt: review.createdAt,
                            productName: review.product?.name ?? "Deleted product",
                          }}
                        />
                        <ReviewActions
                          id={review.id}
                          visible={review.visible}
                          label={`${review.customerName} · ${review.product?.name ?? "deleted product"}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pageCount > 1 ? <Pagination status={status} page={page} pageCount={pageCount} total={total} /> : null}
      </div>
    </div>
  );
}

function Pagination({
  status,
  page,
  pageCount,
  total,
}: {
  status: "all" | "visible" | "hidden";
  page: number;
  pageCount: number;
  total: number;
}) {
  const href = (p: number) => `/reviews?${status === "all" ? "" : `status=${status}&`}page=${p}`;
  const pagerLink = "rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2";
  const pagerDisabled = "rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted opacity-50";

  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3">
      <span className="text-xs text-muted">
        Page {page} of {pageCount} · {total} {total === 1 ? "review" : "reviews"}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={pagerLink}>
            Previous
          </Link>
        ) : (
          <span className={pagerDisabled}>Previous</span>
        )}
        {page < pageCount ? (
          <Link href={href(page + 1)} className={pagerLink}>
            Next
          </Link>
        ) : (
          <span className={pagerDisabled}>Next</span>
        )}
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
