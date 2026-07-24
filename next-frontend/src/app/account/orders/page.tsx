"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS } from "@consts";
import { relayUrl } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Order = {
  number: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  trackingNumber: string | null;
  items: { productName: string; quantity: number }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  function reload() {
    fetch(relayUrl("/orders/mine"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Order[]) => setOrders(data))
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    reload();
  }, []);

  async function onCancel(o: Order) {
    const ok = await confirm({
      title: "Cancel this order?",
      description: "We'll stop it before it ships. This can't be undone.",
      targetName: `Order ${o.number}`,
      destructive: true,
      confirmLabel: "Cancel order",
    });
    if (!ok) return;
    setBusyId(o.number);
    setError(null);
    try {
      const res = await fetch(relayUrl(`/orders/mine/${o.number}/cancel`), {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Cancel failed");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(o: Order) {
    const ok = await confirm({
      title: "Delete this order?",
      description: "This removes it from your order history. This can't be undone.",
      targetName: `Order ${o.number}`,
      destructive: true,
      confirmLabel: "Delete order",
    });
    if (!ok) return;
    setBusyId(o.number);
    setError(null);
    try {
      const res = await fetch(relayUrl(`/orders/mine/${o.number}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Delete failed");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!orders) return <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">Loading orders…</div>;
  if (!orders.length)
    return (
      <div className="rounded-2xl border border-line bg-surface p-10">
        <div className="font-display text-xl text-ink">No orders yet.</div>
        <p className="mt-2 text-sm text-muted">When you place an order, it will show up here.</p>
        <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-background">Browse shop</Link>
      </div>
    );

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      {orders.map((o) => {
        const busy = busyId === o.number;
        const cancellable = o.status === ORDER_STATUS.PENDING;
        const deletable = o.status === ORDER_STATUS.CANCELLED;
        return (
          <div key={o.number} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{new Date(o.createdAt).toLocaleDateString()}</div>
                <Link href={`/orders/${o.number}`} className="font-display mt-1 block text-lg text-ink underline-offset-4 hover:underline">
                  Order {o.number}
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-full bg-ink/5 px-2.5 py-1 font-mono tracking-[0.05em] text-ink">{capitalize(o.status)}</span>
                <span className="rounded-full bg-ink/5 px-2.5 py-1 font-mono tracking-[0.05em] text-ink">{capitalize(o.paymentStatus)}</span>
                <span className="font-mono text-sm text-ink">{formatPrice(o.totalCents)}</span>
              </div>
            </div>
            <ul className="mt-3 text-xs text-muted">
              {o.items.map((i, idx) => <li key={idx}>· {i.quantity} × {i.productName}</li>)}
            </ul>
            {o.trackingNumber ? (
              <div className="mt-3 font-mono text-xs text-muted">Tracking: {o.trackingNumber}</div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Link
                href={`/orders/${o.number}`}
                className="text-xs font-medium text-ink underline-offset-2 hover:underline"
              >
                View details
              </Link>
              {cancellable ? (
                <>
                  <span className="text-line">·</span>
                  <button
                    type="button"
                    onClick={() => onCancel(o)}
                    disabled={busy}
                    className="text-xs font-medium text-muted underline-offset-2 hover:text-bad hover:underline disabled:opacity-50"
                  >
                    {busy ? "Cancelling…" : "Cancel order"}
                  </button>
                </>
              ) : null}
              {deletable ? (
                <>
                  <span className="text-line">·</span>
                  <button
                    type="button"
                    onClick={() => onDelete(o)}
                    disabled={busy}
                    className="text-xs font-medium text-muted underline-offset-2 hover:text-bad hover:underline disabled:opacity-50"
                  >
                    {busy ? "Deleting…" : "Delete"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
