"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, type OrderStatus } from "@consts";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

const STATUSES = Object.values(ORDER_STATUS);

const DESTRUCTIVE_STATUSES: ReadonlySet<string> = new Set([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);

export function OrderActions({
  id,
  status,
  trackingNumber,
}: {
  id: string;
  status: string;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  const [savedStatus, setSavedStatus] = useState(status);
  const [savedTracking, setSavedTracking] = useState((trackingNumber ?? "").trim());
  const [s, setS] = useState(status);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [sendingShipped, setSendingShipped] = useState(false);
  const [shippedMessage, setShippedMessage] = useState<string | null>(null);

  async function save() {
    const nextTracking = tracking.trim();
    const statusChanged = s !== savedStatus;
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
    if (s === ORDER_STATUS.DELIVERED && savedStatus !== ORDER_STATUS.DELIVERED) {
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
        body: JSON.stringify({ status: s, trackingNumber: nextTracking || null }),
      });
      setSavedStatus(s);
      setSavedTracking(nextTracking);
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

  const normalizedTracking = tracking.trim();
  const hasChanges = s !== savedStatus || normalizedTracking !== savedTracking;
  const trackingSaved = savedTracking.length > 0 && normalizedTracking === savedTracking;
  const shippedEmailTitle = hasChanges
    ? "Save changes before sending"
    : !trackingSaved
      ? "Save a tracking number first"
      : undefined;

  return (
    <div className="w-full rounded-xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:max-w-3xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Status</span>
          <select
            value={s}
            onChange={(e) => setS(e.target.value as OrderStatus)}
            className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink hover:border-line-strong focus:border-ink/30 focus:bg-surface focus:outline-none"
          >
            {STATUSES.map((x) => <option key={x} value={x}>{capitalize(x)}</option>)}
          </select>
        </label>

        <label className="min-w-0 flex-[1.35]">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tracking #</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Leopards CN number"
            className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink placeholder:text-muted hover:border-line-strong focus:border-ink/30 focus:bg-surface focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 lg:pb-0">
          <Button onClick={save} disabled={pending || !hasChanges} size="md">
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            onClick={sendShippedEmail}
            disabled={!trackingSaved || sendingShipped || hasChanges}
            variant="secondary"
            size="md"
            title={shippedEmailTitle}
          >
            {sendingShipped ? "Sending…" : "Send shipped email"}
          </Button>
          <Button onClick={onDelete} variant="danger" size="md">
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>COD order</span>
        <span className="hidden h-1 w-1 rounded-full bg-line-strong sm:inline-block" />
        <span>{shippedMessage ? shippedMessage : hasChanges ? "Unsaved changes" : "No changes"}</span>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
