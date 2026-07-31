"use client";

import { useState } from "react";
import Link from "next/link";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatDateTime, getActiveCurrency } from "@/lib/utils";
import type { PostexCity, PostexPickupAddress, PostexShipment } from "@/lib/postex";
import { NewShipmentModal, type OrderOption } from "../../postex/new-shipment-modal";

const STATUS_PILL: Record<string, string> = {
  delivered: "pill-good",
  booked: "pill-info",
  unbooked: "pill-warn",
  cancelled: "pill-mute",
  returned: "pill-bad",
  "delivery under review": "pill-warn",
};

export function OrderPostexCard({
  order,
  initialShipments,
  cities,
  pickupAddresses,
  defaultPickupAddressCode,
  configured,
}: {
  order: OrderOption;
  initialShipments: PostexShipment[];
  cities: PostexCity[];
  pickupAddresses: PostexPickupAddress[];
  defaultPickupAddressCode: string;
  configured: boolean;
}) {
  const confirm = useConfirm();
  const [shipments, setShipments] = useState(initialShipments);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { symbol } = getActiveCurrency();

  async function refreshStatus(trackingNumber: string) {
    const ok = await confirm({
      title: "Refresh status from PostEx?",
      description: "Checks PostEx for this shipment's latest delivery status and updates it here.",
      targetName: trackingNumber,
      confirmLabel: "Refresh status",
    });
    if (!ok) return;
    setBusy(trackingNumber);
    try {
      const res = await adminClientFetch<{ shipment: PostexShipment | null }>(
        `/postex/shipments/${encodeURIComponent(trackingNumber)}/track`,
        { method: "POST" },
      );
      if (res.shipment) {
        setShipments((prev) => prev.map((s) => (s.trackingNumber === trackingNumber ? res.shipment! : s)));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted">PostEx shipment</div>
        <Button size="sm" variant="secondary" onClick={() => setShowModal(true)} disabled={!configured}>
          {shipments.length > 0 ? "Book another" : "Book shipment"}
        </Button>
      </div>

      {!configured ? (
        <p className="mt-2 text-sm text-muted">
          PostEx isn&apos;t configured — add an API token in the PostEx tab&apos;s Settings to enable booking.
        </p>
      ) : shipments.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Not booked with PostEx yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {shipments.map((s) => (
            <div key={s.id} className="rounded-md border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-ink">{s.trackingNumber}</span>
                <span className={`pill ${STATUS_PILL[s.status.toLowerCase()] ?? "pill-mute"}`}>{s.status}</span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {symbol}
                {Math.round(s.invoicePayment).toLocaleString()} COD · {s.cityName}
              </div>
              <div className="mt-1 text-xs text-muted">
                {s.lastTrackedAt ? `Last tracked ${formatDateTime(s.lastTrackedAt)}` : "Never tracked"}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => refreshStatus(s.trackingNumber)}
                  disabled={busy === s.trackingNumber}
                  className="text-xs font-medium text-accent hover:text-accent-deep disabled:opacity-40"
                >
                  Refresh status
                </button>
                <Link href={`/postex`} className="text-xs font-medium text-accent hover:text-accent-deep">
                  Manage in PostEx tab →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal ? (
        <NewShipmentModal
          cities={cities}
          pickupAddresses={pickupAddresses}
          defaultPickupAddressCode={defaultPickupAddressCode}
          lockedOrder={order}
          onClose={() => setShowModal(false)}
          onCreated={(shipment) => {
            setShipments((prev) => [shipment, ...prev]);
            setShowModal(false);
          }}
        />
      ) : null}
    </div>
  );
}
