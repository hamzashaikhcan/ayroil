"use client";

import { useEffect, useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { formatDate } from "@/lib/utils";

type PaymentStatus = {
  orderRefNumber: string;
  trackingNumber: string;
  settle: boolean;
  settlementDate: string | null;
  upfrontPaymentDate: string | null;
  cprNumber_1: string | null;
  reservePaymentDate: string | null;
  cprNumber_2: string | null;
};

export function PaymentStatusModal({ trackingNumber, onClose }: { trackingNumber: string; onClose: () => void }) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminClientFetch<PaymentStatus>(`/postex/shipments/${encodeURIComponent(trackingNumber)}/payment-status`)
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load payment status."))
      .finally(() => setLoading(false));
  }, [trackingNumber]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)]">
        <h2 className="text-lg font-semibold text-ink">Payment status</h2>
        <p className="mt-0.5 font-mono text-xs text-muted">{trackingNumber}</p>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : error ? (
            <p className="text-sm text-bad">{error}</p>
          ) : status ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2.5">
                <span className="text-sm text-ink">Cash settled to merchant</span>
                <span className={`pill ${status.settle ? "pill-good" : "pill-warn"}`}>
                  {status.settle ? "Settled" : "Not settled yet"}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Order ref #" value={status.orderRefNumber} />
                <Field label="Settlement date" value={status.settlementDate ? formatDate(status.settlementDate) : "—"} />
                <Field label="Upfront payment date" value={status.upfrontPaymentDate ? formatDate(status.upfrontPaymentDate) : "—"} />
                <Field label="Upfront CPR #" value={status.cprNumber_1 || "—"} />
                <Field label="Reserve payment date" value={status.reservePaymentDate ? formatDate(status.reservePaymentDate) : "—"} />
                <Field label="Reserve CPR #" value={status.cprNumber_2 || "—"} />
              </dl>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
