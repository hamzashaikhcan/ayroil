"use client";

import { useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import type { PostexCity, PostexPickupAddress } from "@/lib/postex";

export function PickupAddressesTab({
  initialPickupAddresses,
  onChange,
  cities,
  defaultPickupAddressCode,
  onSetDefault,
  configured,
}: {
  initialPickupAddresses: PostexPickupAddress[];
  onChange: (addresses: PostexPickupAddress[]) => void;
  cities: PostexCity[];
  defaultPickupAddressCode: string;
  onSetDefault: (code: string) => void;
  configured: boolean;
}) {
  const [addresses, setAddresses] = useState(initialPickupAddresses);
  const [showForm, setShowForm] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  async function refresh() {
    const fresh = await adminClientFetch<PostexPickupAddress[]>("/postex/pickup-addresses");
    setAddresses(fresh);
    onChange(fresh);
  }

  async function setAsDefault(code: string) {
    setSettingDefault(code);
    try {
      await adminClientFetch("/postex/settings", {
        method: "PUT",
        body: JSON.stringify({ postexDefaultPickupAddressCode: code }),
      });
    } finally {
      setSettingDefault(null);
    }
  }

  return (
    <div className="space-y-4">
      {!configured ? (
        <div className="rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink">
          PostEx isn&apos;t configured yet — add an API token in the Settings tab to view or manage pickup addresses.
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Warehouse / return addresses registered with PostEx for this merchant.</p>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!configured}>
          New address
        </Button>
      </div>

      <div className="card table-card-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Address</th>
                <th className="px-5 py-2.5 font-medium">City</th>
                <th className="px-5 py-2.5 font-medium">Contact</th>
                <th className="px-5 py-2.5 font-medium">Phones</th>
                <th className="px-5 py-2.5 font-medium">Code</th>
                <th className="px-5 py-2.5 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {addresses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted">
                    {configured ? "No pickup addresses yet. Create one to start booking shipments." : "Nothing to show yet."}
                  </td>
                </tr>
              ) : (
                addresses.map((a) => (
                  <tr key={a.addressCode} className="border-b border-line last:border-b-0 row-hover">
                    <td className="px-5 py-3" data-label="Address">{a.address}</td>
                    <td className="px-5 py-3" data-label="City">{a.cityName}</td>
                    <td className="px-5 py-3" data-label="Contact">{a.contactPersonName}</td>
                    <td className="px-5 py-3 text-muted" data-label="Phones">
                      {a.phone1}
                      {a.phone2 ? ` · ${a.phone2}` : ""}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted" data-label="Code">{a.addressCode}</td>
                    <td className="px-5 py-3" data-label="Default">
                      {defaultPickupAddressCode === a.addressCode ? (
                        <span className="pill pill-good">Default</span>
                      ) : (
                        <button
                          onClick={async () => {
                            await setAsDefault(a.addressCode);
                            onSetDefault(a.addressCode);
                          }}
                          disabled={settingDefault === a.addressCode}
                          className="text-xs font-medium text-accent hover:text-accent-deep"
                        >
                          {settingDefault === a.addressCode ? "Setting…" : "Set as default"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm ? (
        <NewAddressModal
          cities={cities}
          onClose={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function NewAddressModal({
  cities,
  onClose,
  onCreated,
}: {
  cities: PostexCity[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [address, setAddress] = useState("");
  const [addressTypeId, setAddressTypeId] = useState<1 | 2>(2);
  const [cityName, setCityName] = useState(cities[0]?.operationalCityName ?? "");
  const [contactPersonName, setContactPersonName] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [wareHouseManagerName, setWareHouseManagerName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await adminClientFetch("/postex/pickup-addresses", {
        method: "POST",
        body: JSON.stringify({
          address,
          addressTypeId,
          cityName,
          contactPersonName,
          phone1,
          phone2,
          wareHouseManagerName: wareHouseManagerName || undefined,
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create address.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={submit}
        className="relative w-full max-w-2xl rounded-xl border border-line bg-surface shadow-[0_24px_80px_-24px_rgba(16,24,40,0.25)]"
      >
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">New pickup / return address</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-xs font-medium text-muted">Address</span>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted">Type</span>
            <select
              value={addressTypeId}
              onChange={(e) => setAddressTypeId(Number(e.target.value) as 1 | 2)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            >
              <option value={2}>Pickup</option>
              <option value={1}>Return</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-medium text-muted">City</span>
            {cities.length > 0 ? (
              <select
                required
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              >
                {cities.map((c) => (
                  <option key={c.operationalCityName} value={c.operationalCityName}>
                    {c.operationalCityName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            )}
          </label>
          <label>
            <span className="text-xs font-medium text-muted">Contact person</span>
            <input
              required
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted">Warehouse manager (optional)</span>
            <input
              value={wareHouseManagerName}
              onChange={(e) => setWareHouseManagerName(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted">Phone 1</span>
            <input
              required
              value={phone1}
              onChange={(e) => setPhone1(e.target.value)}
              placeholder="03xxxxxxxxx"
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-medium text-muted">Phone 2</span>
            <input
              required
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              placeholder="03xxxxxxxxx"
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
            />
          </label>
        </div>

        {error ? <div className="px-5 pb-2 text-sm text-bad">{error}</div> : null}

        <div className="flex items-center justify-end gap-2 border-t border-line p-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Cancel
          </button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create address"}
          </Button>
        </div>
      </form>
    </div>
  );
}
