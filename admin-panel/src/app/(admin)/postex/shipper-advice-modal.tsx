"use client";

import { useEffect, useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type AdviceRecord = { remarks: string; remarksDate: string; username: string };
type AdviceResponse = { trackingNumber: string; message: string; trackingResponse: AdviceRecord[] }[];

export function ShipperAdviceModal({
  trackingNumber,
  onClose,
  onSaved,
}: {
  trackingNumber: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [statusId, setStatusId] = useState<1 | 2>(1);
  const [remarks, setRemarks] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AdviceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    adminClientFetch<AdviceResponse>(`/postex/shipments/${encodeURIComponent(trackingNumber)}/shipper-advice`)
      .then((res) => setHistory(res[0]?.trackingResponse ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [trackingNumber]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await adminClientFetch(`/postex/shipments/${encodeURIComponent(trackingNumber)}/shipper-advice`, {
        method: "PUT",
        body: JSON.stringify({ statusId, remarks }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save advice.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={submit}
        className="relative grid w-full max-w-3xl grid-cols-1 rounded-xl border border-line bg-surface shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)] md:grid-cols-2"
      >
        <div className="p-5">
          <h2 className="text-lg font-semibold text-ink">Shipper advice</h2>
          <p className="mt-0.5 font-mono text-xs text-muted">{trackingNumber}</p>

          <div className="mt-4 space-y-4">
            <label>
              <span className="text-xs font-medium text-muted">Advice</span>
              <select
                value={statusId}
                onChange={(e) => setStatusId(Number(e.target.value) as 1 | 2)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              >
                <option value={1}>Mark return requested</option>
                <option value={2}>Mark retry attempt</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-medium text-muted">Remarks</span>
              <textarea
                required
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </label>
          </div>

          {error ? <div className="mt-3 text-sm text-bad">{error}</div> : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
            >
              Close
            </button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save advice"}
            </Button>
          </div>
        </div>

        <div className="border-t border-line p-5 md:border-l md:border-t-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">History</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {loadingHistory ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted">No advice recorded yet.</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="rounded-md border border-line bg-surface-2 p-2.5 text-xs">
                  <div className="text-ink">{h.remarks}</div>
                  <div className="mt-1 text-muted">
                    {h.username} · {formatDate(h.remarksDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
