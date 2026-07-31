"use client";

import { useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function SyncModal({ onClose, onSynced }: { onClose: () => void; onSynced: () => void }) {
  const [fromDate, setFromDate] = useState(isoDaysAgo(30));
  const [toDate, setToDate] = useState(isoDaysAgo(0));
  const [onlyUnbooked, setOnlyUnbooked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; updated: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await adminClientFetch<{ imported: number; updated: number }>("/postex/shipments/sync", {
        method: "POST",
        body: JSON.stringify({ fromDate, toDate, onlyUnbooked }),
      });
      setResult(res);
      onSynced();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)]"
      >
        <h2 className="text-lg font-semibold text-ink">Sync from PostEx</h2>
        <p className="mt-0.5 text-xs text-muted">
          Pulls every order PostEx has on file for this date range — including ones booked directly in the PostEx
          portal — and adds or refreshes them here.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <span className="text-xs font-medium text-muted">From</span>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted">To</span>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={onlyUnbooked}
            onChange={(e) => setOnlyUnbooked(e.target.checked)}
            className="h-4 w-4 rounded border-line-strong"
          />
          Only orders PostEx hasn&apos;t booked yet
        </label>

        {error ? <div className="mt-3 text-sm text-bad">{error}</div> : null}
        {result ? (
          <div className="mt-3 text-sm text-good">
            Synced — {result.imported} new, {result.updated} updated.
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Close
          </button>
          <Button type="submit" disabled={pending}>
            {pending ? "Syncing…" : "Sync"}
          </Button>
        </div>
      </form>
    </div>
  );
}
