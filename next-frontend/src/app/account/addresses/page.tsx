"use client";

import "react-phone-number-input/style.css";
import "@/app/checkout/phone-input.css";

import { useEffect, useState } from "react";
import PhoneInput, { isValidPhoneNumber, type Country } from "react-phone-number-input";
import { relayUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { COUNTRIES } from "@/lib/countries";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type FormState = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: Country;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "PK",
  isDefault: false,
};

export default function AddressesPage() {
  const [items, setItems] = useState<Address[] | null>(null);
  const [mode, setMode] = useState<"closed" | "add" | { editing: string }>("closed");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;
    fetch(relayUrl("/addresses"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Address[]) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [refresh]);

  const reload = () => setRefresh((n) => n + 1);

  function openAdd() {
    setForm(EMPTY_FORM);
    setError(null);
    setMode("add");
  }

  function openEdit(a: Address) {
    setForm({
      label: a.label,
      fullName: a.fullName,
      phone: a.phone ?? "",
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      region: a.region,
      postalCode: a.postalCode,
      country: (a.country || "PK") as Country,
      isDefault: a.isDefault,
    });
    setError(null);
    setMode({ editing: a.id });
  }

  function closeForm() {
    setMode("closed");
    setError(null);
  }

  function patch<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (form.phone && !isValidPhoneNumber(form.phone)) {
      setError("Enter a valid phone number (or leave it empty).");
      return;
    }

    setSaving(true);
    setError(null);

    const body = {
      label: form.label.trim() || "Home",
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
      line1: form.line1.trim(),
      line2: form.line2.trim() || null,
      city: form.city.trim(),
      region: form.region.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country,
      isDefault: form.isDefault,
    };

    const isEdit = typeof mode === "object" && "editing" in mode;
    const url = isEdit ? relayUrl(`/addresses/${mode.editing}`) : relayUrl("/addresses");
    const method = isEdit ? "PUT" : "POST";

    try {
      const r = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(text || `Save failed (${r.status})`);
      }
      closeForm();
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(a: Address) {
    const ok = await confirm({
      title: "Delete this address?",
      description: a.isDefault
        ? "This is your default address — you'll need to pick a new default at checkout."
        : "We'll remove it from your saved addresses. You can add it again any time.",
      targetName: `${a.label} · ${a.fullName}, ${a.city}`,
      destructive: true,
      confirmLabel: "Delete address",
    });
    if (!ok) return;
    await fetch(relayUrl(`/addresses/${a.id}`), { method: "DELETE", credentials: "include" });
    reload();
  }

  const editingId = typeof mode === "object" ? mode.editing : null;
  const formOpen = mode !== "closed";
  const formTitle = editingId ? "Edit address" : "Add a new address";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-display text-2xl text-ink">Saved addresses</div>
          <p className="mt-1 text-sm text-muted">Reused at checkout to save you typing.</p>
        </div>
        {!formOpen ? (
          <Button onClick={openAdd} variant="secondary" size="sm">Add address</Button>
        ) : (
          <Button onClick={closeForm} variant="ghost" size="sm">Cancel</Button>
        )}
      </div>

      {formOpen ? (
        <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{formTitle}</div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="Label" value={form.label} onChange={(v) => patch("label", v)} placeholder="Home, Office…" />
            <TextField label="Full name" value={form.fullName} onChange={(v) => patch("fullName", v)} required />
            <TextField label="Address line 1" value={form.line1} onChange={(v) => patch("line1", v)} required className="md:col-span-2" />
            <TextField label="Apt, suite (optional)" value={form.line2} onChange={(v) => patch("line2", v)} className="md:col-span-2" />
            <TextField label="City" value={form.city} onChange={(v) => patch("city", v)} required />
            <TextField label="State / Province" value={form.region} onChange={(v) => patch("region", v)} required />
            <TextField label="Postal code" value={form.postalCode} onChange={(v) => patch("postalCode", v)} required />
            <div>
              <label htmlFor="addr-country" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Country <span className="text-red-600">*</span></label>
              <select
                id="addr-country"
                value={form.country}
                onChange={(e) => patch("country", e.target.value as Country)}
                required
                className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="addr-phone" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Phone (optional)</label>
              <PhoneInput
                id="addr-phone"
                international
                defaultCountry="PK"
                countryCallingCodeEditable={false}
                countrySelectProps={{ disabled: true }}
                value={form.phone}
                onChange={(v) => patch("phone", v ?? "")}
                className="mt-2"
              />
            </div>
          </div>
          <label className="mt-5 inline-flex items-center gap-2 text-xs text-ink">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => patch("isDefault", e.target.checked)}
            />{" "}
            Set as default
          </label>
          {error ? (
            <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          ) : null}
          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update address" : "Save address"}
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm} disabled={saving}>Cancel</Button>
          </div>
        </form>
      ) : null}

      {!items ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">No saved addresses yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((a) => {
            const countryName = COUNTRIES.find((c) => c.code === a.country)?.name ?? a.country;
            return (
              <div key={a.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{a.label}{a.isDefault ? " · Default" : ""}</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(a)} className="text-xs text-ink underline-offset-4 hover:underline">Edit</button>
                    <button onClick={() => onDelete(a)} className="text-xs text-muted underline-offset-4 hover:text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
                <div className="font-display mt-3 text-base text-ink">{a.fullName}</div>
                <div className="mt-1 text-sm text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
                <div className="text-sm text-muted">{a.city}, {a.region} {a.postalCode} · {countryName}</div>
                {a.phone ? <div className="mt-1 text-xs text-muted">{a.phone}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
      />
    </div>
  );
}
