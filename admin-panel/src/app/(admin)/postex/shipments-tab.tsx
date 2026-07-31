"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RowMenu } from "@/components/ui/row-menu";
import { formatDateTime, getActiveCurrency } from "@/lib/utils";
import type { PostexCity, PostexPickupAddress, PostexShipment } from "@/lib/postex";
import { NewShipmentModal } from "./new-shipment-modal";
import { ShipperAdviceModal } from "./shipper-advice-modal";
import { PaymentStatusModal } from "./payment-status-modal";
import { SyncModal } from "./sync-modal";

const STATUS_PILL: Record<string, string> = {
  delivered: "pill-good",
  booked: "pill-info",
  unbooked: "pill-warn",
  cancelled: "pill-mute",
  returned: "pill-bad",
  "delivery under review": "pill-warn",
};

function money(amount: number) {
  const { symbol } = getActiveCurrency();
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

export function ShipmentsTab({
  initialShipments,
  pickupAddresses,
  cities,
  defaultPickupAddressCode,
  configured,
}: {
  initialShipments: PostexShipment[];
  pickupAddresses: PostexPickupAddress[];
  cities: PostexCity[];
  defaultPickupAddressCode: string;
  configured: boolean;
}) {
  const confirm = useConfirm();
  const [shipments, setShipments] = useState(initialShipments);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [adviceFor, setAdviceFor] = useState<string | null>(null);
  const [paymentStatusFor, setPaymentStatusFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((s) =>
      [s.trackingNumber, s.orderRefNumber, s.customerName, s.customerPhone, s.cityName, s.orderNumber ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [shipments, query]);

  function setRowBusy(tn: string, on: boolean) {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(tn);
      else next.delete(tn);
      return next;
    });
  }

  function toggleSelected(tn: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tn)) next.delete(tn);
      else next.add(tn);
      return next;
    });
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.trackingNumber));
  const someFilteredSelected = filtered.some((s) => selected.has(s.trackingNumber));
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [someFilteredSelected, allFilteredSelected]);

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const s of filtered) next.delete(s.trackingNumber);
      } else {
        for (const s of filtered) next.add(s.trackingNumber);
      }
      return next;
    });
  }

  async function refreshStatus(trackingNumber: string) {
    const ok = await confirm({
      title: "Refresh status from PostEx?",
      description: "Checks PostEx for this shipment's latest delivery status and updates it here.",
      targetName: trackingNumber,
      confirmLabel: "Refresh status",
    });
    if (!ok) return;
    setRowBusy(trackingNumber, true);
    try {
      const res = await adminClientFetch<{ shipment: PostexShipment | null }>(
        `/postex/shipments/${encodeURIComponent(trackingNumber)}/track`,
        { method: "POST" },
      );
      if (res.shipment) {
        setShipments((prev) => prev.map((s) => (s.trackingNumber === trackingNumber ? res.shipment! : s)));
      }
    } finally {
      setRowBusy(trackingNumber, false);
    }
  }

  async function cancel(trackingNumber: string) {
    const ok = await confirm({
      title: "Cancel this shipment?",
      description: "PostEx will be asked to cancel the booking. This can't always be undone once the order has already moved.",
      targetName: trackingNumber,
      destructive: true,
      confirmLabel: "Cancel shipment",
    });
    if (!ok) return;
    setRowBusy(trackingNumber, true);
    try {
      const updated = await adminClientFetch<PostexShipment>(`/postex/shipments/${encodeURIComponent(trackingNumber)}/cancel`, {
        method: "POST",
      });
      setShipments((prev) => prev.map((s) => (s.trackingNumber === trackingNumber ? updated : s)));
    } finally {
      setRowBusy(trackingNumber, false);
    }
  }

  async function bulkRefreshStatus() {
    if (selected.size === 0) return;
    const ok = await confirm({
      title: `Refresh status for ${selected.size} shipment${selected.size > 1 ? "s" : ""}?`,
      description: "Checks PostEx for each selected shipment's latest delivery status.",
      confirmLabel: "Refresh status",
    });
    if (!ok) return;
    setBulkBusy(true);
    try {
      await adminClientFetch("/postex/shipments/track-bulk", {
        method: "POST",
        body: JSON.stringify({ trackingNumbers: [...selected] }),
      });
      const fresh = await adminClientFetch<PostexShipment[]>("/postex/shipments");
      setShipments(fresh);
    } finally {
      setBulkBusy(false);
    }
  }

  function openAirwayBill(trackingNumbers: string[]) {
    const qs = new URLSearchParams({ kind: "airway-bill", trackingNumbers: trackingNumbers.slice(0, 10).join(",") });
    window.open(`/api/postex-pdf?${qs.toString()}`, "_blank");
  }

  function openLoadSheet() {
    if (selected.size === 0) return;
    const qs = new URLSearchParams({ kind: "load-sheet", trackingNumbers: [...selected].join(",") });
    window.open(`/api/postex-pdf?${qs.toString()}`, "_blank");
  }

  async function syncShipments() {
    const fresh = await adminClientFetch<PostexShipment[]>("/postex/shipments");
    setShipments(fresh);
  }

  return (
    <div className="space-y-4">
      {!configured ? (
        <div className="rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink">
          PostEx isn&apos;t configured yet — add an API token in the Settings tab to book, track, or manage shipments.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracking #, order ref, customer, city…"
          className="h-9 w-full max-w-sm rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 ? (
            <>
              <span className="text-xs text-muted">{selected.size} selected</span>
              <Button size="sm" variant="secondary" onClick={bulkRefreshStatus} disabled={bulkBusy || !configured}>
                {bulkBusy ? "Refreshing…" : "Refresh status"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openAirwayBill([...selected])} disabled={!configured}>
                Airway bill{selected.size > 1 ? "s" : ""}
              </Button>
              <Button size="sm" variant="secondary" onClick={openLoadSheet} disabled={!configured}>
                Load sheet
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => setShowSyncModal(true)} disabled={!configured}>
            Sync from PostEx
          </Button>
          <Button size="sm" onClick={() => setShowNewModal(true)} disabled={!configured}>
            New shipment
          </Button>
        </div>
      </div>

      <div className="card table-card-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="w-9 px-4 py-2.5">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    disabled={filtered.length === 0}
                    aria-label="Select all shipments"
                    className="h-4 w-4 rounded border-line-strong"
                  />
                </th>
                <th className="px-3 py-2.5 font-medium">Tracking #</th>
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 font-medium">City</th>
                <th className="px-3 py-2.5 font-medium">COD</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Last checked</th>
                <th className="w-14 px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-muted">
                    {shipments.length === 0 ? "No PostEx shipments yet. Book one to get started." : "No shipments match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isBusy = busy.has(s.trackingNumber);
                  return (
                    <tr key={s.id} className="border-b border-line last:border-b-0 row-hover">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(s.trackingNumber)}
                          onChange={() => toggleSelected(s.trackingNumber)}
                          className="h-4 w-4 rounded border-line-strong"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs font-medium text-ink" data-label="Tracking #">
                        {s.trackingNumber}
                      </td>
                      <td className="px-3 py-3" data-label="Order">
                        {s.orderId && s.orderNumber ? (
                          <Link href={`/orders/${s.orderId}`} className="font-mono text-xs font-medium text-accent hover:text-accent-deep">
                            {s.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">{s.orderRefNumber}</span>
                        )}
                      </td>
                      <td className="px-3 py-3" data-label="Customer">
                        <div className="font-medium text-ink">{s.customerName}</div>
                        <div className="text-xs text-muted">{s.customerPhone}</div>
                      </td>
                      <td className="px-3 py-3 text-muted" data-label="City">{s.cityName}</td>
                      <td className="px-3 py-3 font-medium tabular-nums text-ink" data-label="COD">{money(s.invoicePayment)}</td>
                      <td className="px-3 py-3 text-muted" data-label="Type">{s.orderType}</td>
                      <td className="px-3 py-3" data-label="Status">
                        <span className={`pill ${STATUS_PILL[s.status.toLowerCase()] ?? "pill-mute"}`}>{s.status}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted" data-label="Last checked">
                        {s.lastTrackedAt ? formatDateTime(s.lastTrackedAt) : "Never"}
                      </td>
                      <td className="px-3 py-3 text-right" data-label="Actions">
                        <RowMenu
                          disabled={isBusy}
                          items={[
                            {
                              label: "Refresh status",
                              onClick: () => refreshStatus(s.trackingNumber),
                              disabled: !configured,
                              title: "Check PostEx for this shipment's latest delivery status",
                            },
                            {
                              label: "Airway bill (COD slip)",
                              onClick: () => openAirwayBill([s.trackingNumber]),
                              disabled: !configured,
                              title: "Print the COD airway bill / shipping label",
                            },
                            {
                              label: "Payment status",
                              onClick: () => setPaymentStatusFor(s.trackingNumber),
                              disabled: !configured,
                              title: "Check whether PostEx has settled COD cash for this shipment",
                            },
                            {
                              label: "Shipper advice",
                              onClick: () => setAdviceFor(s.trackingNumber),
                              disabled: !configured,
                              title: "Tell PostEx to retry delivery or mark this a return",
                            },
                            ...(s.status.toLowerCase() !== "cancelled"
                              ? ([
                                  { type: "separator" },
                                  {
                                    label: "Cancel shipment",
                                    onClick: () => cancel(s.trackingNumber),
                                    disabled: !configured,
                                    destructive: true,
                                  },
                                ] as const)
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal ? (
        <NewShipmentModal
          cities={cities}
          pickupAddresses={pickupAddresses}
          defaultPickupAddressCode={defaultPickupAddressCode}
          onClose={() => setShowNewModal(false)}
          onCreated={(shipment) => {
            setShipments((prev) => [shipment, ...prev]);
            setShowNewModal(false);
          }}
        />
      ) : null}

      {showSyncModal ? (
        <SyncModal onClose={() => setShowSyncModal(false)} onSynced={syncShipments} />
      ) : null}

      {adviceFor ? (
        <ShipperAdviceModal
          trackingNumber={adviceFor}
          onClose={() => setAdviceFor(null)}
          onSaved={() => setAdviceFor(null)}
        />
      ) : null}

      {paymentStatusFor ? (
        <PaymentStatusModal trackingNumber={paymentStatusFor} onClose={() => setPaymentStatusFor(null)} />
      ) : null}
    </div>
  );
}
