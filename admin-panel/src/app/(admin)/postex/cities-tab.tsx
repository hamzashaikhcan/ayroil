"use client";

import { useMemo, useState } from "react";
import type { PostexCity } from "@/lib/postex";

export function CitiesTab({ cities, configured }: { cities: PostexCity[]; configured: boolean }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.operationalCityName.toLowerCase().includes(q));
  }, [cities, query]);

  if (!configured) {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        PostEx isn&apos;t configured yet. Add an API token in the Settings tab to load the list of cities PostEx serves.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities…"
          className="h-9 w-full max-w-sm rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
        />
        <span className="text-xs text-muted">{cities.length} cities served</span>
      </div>

      <div className="card table-card-shell">
        <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
            <thead className="sticky top-0 border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">City</th>
                <th className="px-5 py-2.5 font-medium">Country</th>
                <th className="px-5 py-2.5 font-medium">Pickup</th>
                <th className="px-5 py-2.5 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-muted">
                    No cities match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.operationalCityName} className="border-b border-line last:border-b-0 row-hover">
                    <td className="px-5 py-2.5 font-medium text-ink" data-label="City">{c.operationalCityName}</td>
                    <td className="px-5 py-2.5 text-muted" data-label="Country">{c.countryName}</td>
                    <td className="px-5 py-2.5" data-label="Pickup">
                      <span className={`pill ${c.isPickupCity ? "pill-good" : "pill-mute"}`}>
                        {c.isPickupCity ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-2.5" data-label="Delivery">
                      <span className={`pill ${c.isDeliveryCity ? "pill-good" : "pill-mute"}`}>
                        {c.isDeliveryCity ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
