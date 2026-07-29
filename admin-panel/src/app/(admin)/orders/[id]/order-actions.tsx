"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, type OrderStatus } from "@consts";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getActiveCurrency } from "@/lib/utils";

const STATUSES = Object.values(ORDER_STATUS);

const DESTRUCTIVE_STATUSES: ReadonlySet<string> = new Set([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);

export function OrderActions({
  id,
  status,
  trackingNumber,
  actualShippingCostCents,
}: {
  id: string;
  status: string;
  trackingNumber: string | null;
  actualShippingCostCents: number | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { symbol } = getActiveCurrency();
  const [pending, setPending] = useState(false);
  const [savedStatus, setSavedStatus] = useState(status);
  const [savedTracking, setSavedTracking] = useState((trackingNumber ?? "").trim());
  const [savedShipCost, setSavedShipCost] = useState(
    actualShippingCostCents != null ? String(actualShippingCostCents / 100) : "",
  );
  const [s, setS] = useState(status);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [shipCost, setShipCost] = useState(savedShipCost);
  const [sendingShipped, setSendingShipped] = useState(false);
  const [shippedMessage, setShippedMessage] = useState<string | null>(null);

  async function save() {
    const nextTracking = tracking.trim();
    const nextShipCost = shipCost.trim();
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
        body: JSON.stringify({
          status: s,
          trackingNumber: nextTracking || null,
          actualShippingCostCents: nextShipCost ? Math.round(Number(nextShipCost) * 100) : null,
        }),
      });
      setSavedStatus(s);
      setSavedTracking(nextTracking);
      setSavedShipCost(nextShipCost);
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
  const normalizedShipCost = shipCost.trim();
  const hasChanges =
    s !== savedStatus || normalizedTracking !== savedTracking || normalizedShipCost !== savedShipCost;
  const shippedEmailTitle = hasChanges
    ? "Save changes before sending"
    : savedTracking.length === 0
      ? "No tracking number set — email will be sent without tracking details"
      : undefined;

  return (
    <div className="w-full rounded-xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:max-w-2xl">
      <div className="flex flex-wrap gap-3">
        <label className="min-w-[9rem] flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Status</span>
          <select
            value={s}
            onChange={(e) => setS(e.target.value as OrderStatus)}
            className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink hover:border-line-strong focus:border-ink/30 focus:bg-surface focus:outline-none"
          >
            {STATUSES.map((x) => <option key={x} value={x}>{capitalize(x)}</option>)}
          </select>
        </label>

        <label className="min-w-[10rem] flex-[1.4]">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tracking #</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Leopards CN number"
            className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink placeholder:text-muted hover:border-line-strong focus:border-ink/30 focus:bg-surface focus:outline-none"
          />
        </label>

        <label className="min-w-[8rem] flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Shipping cost</span>
          <div className="mt-1.5 flex h-9 items-center rounded-md border border-line bg-surface-2 px-2.5 text-sm hover:border-line-strong focus-within:border-ink/30 focus-within:bg-surface">
            <span className="text-muted">{symbol}</span>
            <input
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              value={shipCost}
              onChange={(e) => setShipCost(e.target.value)}
              placeholder="0.00"
              className="ml-1 w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
        <Button onClick={save} disabled={pending || !hasChanges} size="sm">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          onClick={sendShippedEmail}
          disabled={sendingShipped || hasChanges}
          variant="secondary"
          size="sm"
          title={shippedEmailTitle}
        >
          {sendingShipped ? "Sending…" : "Notify shipped"}
        </Button>
        <Button onClick={onDelete} variant="danger" size="sm">
          Delete
        </Button>
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
