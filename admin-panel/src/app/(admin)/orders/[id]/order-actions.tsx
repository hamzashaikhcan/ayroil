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
  trackingNumber,
}: {
  id: string;
  status: string;
  paymentStatus: string;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  const [s, setS] = useState(status);
  const [ps, setPs] = useState(paymentStatus);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [sendingShipped, setSendingShipped] = useState(false);
  const [shippedMessage, setShippedMessage] = useState<string | null>(null);

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
    if (s === ORDER_STATUS.DELIVERED && status !== ORDER_STATUS.DELIVERED) {
      const ok = await confirm({
        title: "Mark this order as delivered?",
        description: "This automatically emails the customer a one-time link asking them to leave a review.",
        targetName: `Order ${id.slice(0, 8)} → delivered`,
        confirmLabel: "Mark delivered",
      });
      if (!ok) return;
    }
    setPending(true);
    try {
      await adminClientFetch(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: s, paymentStatus: ps, trackingNumber: tracking.trim() || null }),
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

  async function sendShippedEmail() {
    setSendingShipped(true);
    setShippedMessage(null);
    try {
      await adminClientFetch(`/orders/${id}/notify-shipped`, { method: "POST" });
      setShippedMessage("Shipped email sent.");
    } catch (err) {
      setShippedMessage(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSendingShipped(false);
    }
  }

  const trackingSaved = (trackingNumber ?? "") === tracking.trim() && tracking.trim().length > 0;

  return (
    <div className="space-y-2.5">
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted">Tracking #</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Leopards CN number"
            className="h-9 w-44 rounded-md border border-line bg-surface px-2 text-xs text-ink placeholder:text-muted hover:border-line-strong focus:border-ink/30 focus:outline-none"
          />
        </div>
        <Button
          onClick={sendShippedEmail}
          disabled={!trackingSaved || sendingShipped}
          variant="secondary"
          size="md"
          title={!trackingSaved ? "Save a tracking number first" : undefined}
        >
          {sendingShipped ? "Sending…" : "Send shipped email"}
        </Button>
        {shippedMessage ? <span className="text-xs text-muted">{shippedMessage}</span> : null}
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
