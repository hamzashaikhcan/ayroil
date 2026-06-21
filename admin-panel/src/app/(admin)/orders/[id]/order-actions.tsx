"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, PAYMENT_STATUS, type OrderStatus } from "@consts";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

const STATUSES = Object.values(ORDER_STATUS);
const PAYMENT_STATUSES = Object.values(PAYMENT_STATUS);

const DESTRUCTIVE_STATUSES: ReadonlySet<string> = new Set([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);

export function OrderActions({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  const [s, setS] = useState(status);
  const [ps, setPs] = useState(paymentStatus);

  async function save() {
    const statusChanged = s !== status;
    const isDestructiveTransition = statusChanged && DESTRUCTIVE_STATUSES.has(s);
    if (isDestructiveTransition) {
      const ok = await confirm({
        title: s === ORDER_STATUS.CANCELLED ? "Cancel this order?" : "Mark this order as refunded?",
        description:
          s === ORDER_STATUS.CANCELLED
            ? "The customer will not be charged (or will be refunded, depending on payment state). Stock for this order's items will be restored automatically."
            : "This marks the order as fully refunded and restores its stock automatically. Make sure the actual payment refund has been issued in your payment provider.",
        targetName: `Order ${id.slice(0, 8)} → ${s}`,
        destructive: true,
        confirmLabel: s === ORDER_STATUS.CANCELLED ? "Cancel order" : "Mark refunded",
      });
      if (!ok) return;
    }
    setPending(true);
    try {
      await adminClientFetch(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: s, paymentStatus: ps }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this order?",
      description:
        "This permanently removes the order, its line items, and its analytics history, and restores stock if it hadn't already been released. This cannot be undone.",
      targetName: `Order ${id}`,
      destructive: true,
      confirmLabel: "Delete order",
      typeToConfirm: "DELETE",
    });
    if (!ok) return;
    await adminClientFetch(`/orders/${id}`, { method: "DELETE" });
    router.push("/orders");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted">Status</span>
        <select
          value={s}
          onChange={(e) => setS(e.target.value as OrderStatus)}
          className="h-9 rounded-md border border-line bg-surface px-2 text-xs text-ink hover:border-line-strong focus:border-ink/30 focus:outline-none"
        >
          {STATUSES.map((x) => <option key={x} value={x}>{capitalize(x)}</option>)}
        </select>
      </div>
      <div className="inline-flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted">Payment</span>
        <select
          value={ps}
          onChange={(e) => setPs(e.target.value)}
          className="h-9 rounded-md border border-line bg-surface px-2 text-xs text-ink hover:border-line-strong focus:border-ink/30 focus:outline-none"
        >
          {PAYMENT_STATUSES.map((x) => <option key={x} value={x}>{capitalize(x)}</option>)}
        </select>
      </div>
      <Button onClick={save} disabled={pending} size="md">
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button onClick={onDelete} variant="secondary" size="md" className="text-bad hover:bg-bad-soft">
        Delete
      </Button>
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
