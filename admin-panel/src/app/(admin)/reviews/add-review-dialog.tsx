"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { SwitchField } from "@/components/ui/switch-field";

type ProductOption = { id: string; name: string; slug: string };

const inputClass =
  "mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none";

export function AddReviewDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [rating, setRating] = useState(5);
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState("");
  const [visible, setVisible] = useState(true);
  const [comment, setComment] = useState("");

  function reset() {
    setProductId(products[0]?.id ?? "");
    setRating(5);
    setCustomerName("");
    setDate("");
    setVisible(true);
    setComment("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !customerName.trim()) return;
    setPending(true);
    setError(null);
    try {
      await adminClientFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId,
          rating,
          customerName: customerName.trim(),
          comment: comment.trim(),
          visible,
          ...(date ? { createdAt: new Date(`${date}T12:00:00`).toISOString() } : {}),
        }),
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        Add review
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-lg border border-line bg-surface p-5 shadow-xl"
          >
            <h2 className="font-display text-lg text-ink">Add review</h2>
            <p className="mt-1 text-xs text-muted">
              Published under the customer name below, on the storefront product page and its structured data.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <label className="text-xs font-medium text-muted">Date (optional, defaults to today)</label>
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
              <SwitchField
                checked={visible}
                onChange={setVisible}
                label="Visible on storefront"
                className="max-w-xs flex-1"
              />
              <div className="flex items-center gap-2">
                {error ? <span className="text-xs text-bad">{error}</span> : null}
                <Button type="button" onClick={() => setOpen(false)} variant="secondary" size="sm" disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending || !productId || !customerName.trim()}>
                  {pending ? "Adding…" : "Add review"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
