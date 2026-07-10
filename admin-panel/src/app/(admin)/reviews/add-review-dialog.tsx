"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { SwitchField } from "@/components/ui/switch-field";

type ProductOption = { id: string; name: string; slug: string };

type ReviewFormValues = {
  rating: number;
  customerName: string;
  /** yyyy-mm-dd for the date input; empty = leave as-is (edit) / today (create). */
  date: string;
  visible: boolean;
  comment: string;
};

const inputClass =
  "mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none";

export function AddReviewDialog({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        Add review
      </Button>
      {open ? (
        <ReviewDialogForm
          title="Add review"
          submitLabel="Add review"
          initial={{ rating: 5, customerName: "", date: "", visible: true, comment: "" }}
          productField={
            <div>
              <label className="text-xs font-medium text-muted">Product</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} required className={inputClass}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          }
          onClose={() => setOpen(false)}
          submit={(values) =>
            adminClientFetch("/reviews", {
              method: "POST",
              body: JSON.stringify({
                productId,
                rating: values.rating,
                customerName: values.customerName.trim(),
                comment: values.comment.trim(),
                visible: values.visible,
                ...(values.date ? { createdAt: new Date(`${values.date}T12:00:00`).toISOString() } : {}),
              }),
            })
          }
          canSubmit={(values) => Boolean(productId) && Boolean(values.customerName.trim())}
        />
      ) : null}
    </>
  );
}

export function EditReviewDialog({
  review,
}: {
  review: {
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    visible: boolean;
    createdAt: string;
    productName: string;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary" size="sm">
        Edit
      </Button>
      {open ? (
        <ReviewDialogForm
          title="Edit review"
          submitLabel="Save changes"
          initial={{
            rating: review.rating,
            customerName: review.customerName,
            date: review.createdAt.slice(0, 10),
            visible: review.visible,
            comment: review.comment,
          }}
          productField={
            <div>
              <label className="text-xs font-medium text-muted">Product</label>
              <div className="mt-1.5 flex h-9 items-center rounded-md border border-line bg-surface-2 px-3 text-sm text-muted">
                {review.productName}
              </div>
            </div>
          }
          onClose={() => setOpen(false)}
          submit={(values) =>
            adminClientFetch(`/reviews/${review.id}`, {
              method: "PATCH",
              body: JSON.stringify({
                rating: values.rating,
                customerName: values.customerName.trim(),
                comment: values.comment.trim(),
                visible: values.visible,
                ...(values.date ? { createdAt: new Date(`${values.date}T12:00:00`).toISOString() } : {}),
              }),
            })
          }
          canSubmit={(values) => Boolean(values.customerName.trim())}
        />
      ) : null}
    </>
  );
}

function ReviewDialogForm({
  title,
  submitLabel,
  initial,
  productField,
  onClose,
  submit,
  canSubmit,
}: {
  title: string;
  submitLabel: string;
  initial: ReviewFormValues;
  productField: React.ReactNode;
  onClose: () => void;
  submit: (values: ReviewFormValues) => Promise<unknown>;
  canSubmit: (values: ReviewFormValues) => boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(initial.rating);
  const [customerName, setCustomerName] = useState(initial.customerName);
  const [date, setDate] = useState(initial.date);
  const [visible, setVisible] = useState(initial.visible);
  const [comment, setComment] = useState(initial.comment);

  const values: ReviewFormValues = { rating, customerName, date, visible, comment };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit(values)) return;
    setPending(true);
    setError(null);
    try {
      await submit(values);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !pending && onClose()}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-lg border border-line bg-surface p-5 shadow-xl"
      >
        <h2 className="font-display text-lg text-ink">{title}</h2>
        <p className="mt-1 text-xs text-muted">
          Published under the customer name below, on the storefront product page and its structured data.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {productField}
          <div>
            <label className="text-xs font-medium text-muted">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={inputClass}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Customer name</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Ahmed Raza"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="What the customer said about the product…"
              className="mt-1.5 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <SwitchField checked={visible} onChange={setVisible} label="Visible on storefront" className="max-w-xs flex-1" />
          <div className="flex items-center gap-2">
            {error ? <span className="text-xs text-bad">{error}</span> : null}
            <Button type="button" onClick={onClose} variant="secondary" size="sm" disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !canSubmit(values)}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
