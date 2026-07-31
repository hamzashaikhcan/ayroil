"use client";

import { useState } from "react";
import { adminClientFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SwitchField } from "@/components/ui/switch-field";
import { Card } from "../settings/_shared/fields";
import type { PostexPickupAddress, PostexSettings } from "@/lib/postex";

export function SettingsTab({
  initial,
  pickupAddresses,
  onDefaultPickupAddressCodeChange,
  onConfiguredChange,
}: {
  initial: PostexSettings | null;
  pickupAddresses: PostexPickupAddress[];
  onDefaultPickupAddressCodeChange: (code: string) => void;
  onConfiguredChange: (configured: boolean) => void;
}) {
  const [token, setToken] = useState(initial?.postexApiToken ?? "");
  const [defaultCode, setDefaultCode] = useState(initial?.postexDefaultPickupAddressCode ?? "");
  const [enabled, setEnabled] = useState(initial?.postexEnabled ?? false);
  const [configured, setConfigured] = useState(initial?.configured ?? false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      const result = await adminClientFetch<PostexSettings>("/postex/settings", {
        method: "PUT",
        body: JSON.stringify({
          postexApiToken: token.trim(),
          postexEnabled: enabled,
          postexDefaultPickupAddressCode: defaultCode,
        }),
      });
      setConfigured(result.configured);
      onConfiguredChange(result.configured);
      onDefaultPickupAddressCodeChange(result.postexDefaultPickupAddressCode);
      setMessage("Saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setPending(false);
    }
  }

  const active = enabled && configured;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`pill ${configured ? "pill-good" : "pill-mute"}`}>
          {configured ? "Token saved" : "No token"}
        </span>
        <span className={`pill ${enabled ? "pill-good" : "pill-mute"}`}>Auto-book {enabled ? "on" : "off"}</span>
        <span className={`pill ${active ? "pill-good" : "pill-warn"}`}>{active ? "Active" : "Inactive"}</span>
        <span className="text-xs text-muted">
          {active
            ? "Every checkout books a PostEx shipment automatically; tracking numbers come from PostEx."
            : "Orders are placed exactly as before — tracking numbers stay a manual field."}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="API credentials"
          subtitle="From your PostEx Merchant Panel → Settings → API. No fallback token — required for anything here to talk to PostEx."
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">API token</label>
              <PasswordInput
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your PostEx merchant token"
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Default pickup address code</label>
              <select
                value={defaultCode}
                onChange={(e) => setDefaultCode(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-2.5 text-sm text-ink hover:border-line-strong focus:border-ink/30 focus:bg-surface focus:outline-none"
              >
                <option value="">None — pick per shipment</option>
                {pickupAddresses.map((a) => (
                  <option key={a.addressCode} value={a.addressCode}>
                    {a.address} ({a.cityName}) — {a.addressCode}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted">Pre-fills the pickup warehouse on new shipments.</p>
            </div>
          </div>
        </Card>

        <Card
          title="Fulfillment mode"
          subtitle="Manual booking from this tab always works once a token is saved — this switch only controls automatic checkout behavior."
        >
          <SwitchField
            checked={enabled}
            onChange={setEnabled}
            label="Auto-book every order with PostEx"
            description={
              configured
                ? "On: checkout books a PostEx shipment automatically. Off: falls back to manual courier entry, like before."
                : "Save an API token before turning this on — it has no effect without one."
            }
          />
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {message ? <span className="text-sm text-muted">{message}</span> : null}
      </div>
    </div>
  );
}
