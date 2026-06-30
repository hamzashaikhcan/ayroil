"use client";

import "react-phone-number-input/style.css";
import "./phone-input.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber, type Country } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart-store";
import { useSettings } from "@/components/providers/settings-context";
import { formatPrice } from "@/lib/utils";
import { relayUrl } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";
import { AUTH_UI_ENABLED } from "@/lib/auth-ui";
import { trackInitiateCheckout, trackPurchase } from "@/lib/analytics";

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
  email: string;
  phone: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: Country;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(s: FormState, addressMode: "saved" | "new"): FieldErrors {
  const errors: FieldErrors = {};

  if (!s.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) errors.email = "Enter a valid email";

  if (!s.phone) errors.phone = "Phone is required";
  else if (!isValidPhoneNumber(s.phone)) errors.phone = "Enter a valid phone number";

  if (addressMode === "new") {
    if (!s.fullName.trim()) errors.fullName = "Full name is required";
    if (!s.line1.trim()) errors.line1 = "Address line 1 is required";
    if (!s.city.trim()) errors.city = "City is required";
    if (!s.region.trim()) errors.region = "State / region is required";
    if (!s.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!s.country) errors.country = "Country is required";
  }

  return errors;
}

export function CheckoutClient({
  session,
  addresses,
}: {
  session: { email: string; name: string } | null;
  addresses: Address[];
}) {
  const router = useRouter();
  const cart = useCart((s) => s.cart);
  const ready = useCart((s) => s.ready);
  const clear = useCart((s) => s.clear);
  const settings = useSettings();

  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new",
  );
  const addressMode: "saved" | "new" = selectedAddressId === "new" ? "new" : "saved";

  const [state, setState] = useState<FormState>({
    email: session?.email ?? "",
    phone: "",
    fullName: session?.name ?? "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "PK",
  });

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function patch<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((prev) => ({ ...prev, [k]: v }));
  }
  function touch(k: keyof FormState) {
    setTouched((prev) => ({ ...prev, [k]: true }));
  }

  const errors = useMemo(() => validate(state, addressMode), [state, addressMode]);
  const isValid = Object.keys(errors).length === 0;

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalCents ?? 0;
  const shippingCents =
    settings.freeShippingEnabled || subtotal >= settings.freeShippingThresholdCents
      ? 0
      : settings.standardShippingCents;
  const totalCents = subtotal + shippingCents;

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    if (!ready || items.length === 0) return;
    trackInitiateCheckout(
      items.map((i) => ({ id: i.productId, name: i.name, priceCents: i.priceCents, quantity: i.quantity })),
    );
    // Fire once per checkout-page visit, not on every cart mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function selectAddress(id: string | "new") {
    setSelectedAddressId(id);
    // Reset touched state so switching mode doesn't shout about fields
    // the user hasn't seen yet (e.g. switching to "new" right after submit).
    setTouched({});
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    setTouched({
      email: true,
      phone: true,
      fullName: true,
      line1: true,
      city: true,
      region: true,
      postalCode: true,
      country: true,
    });
    if (!isValid) return;

    setSubmitting(true);

    const shippingAddress: Record<string, string | null> = selectedAddress
      ? {
          fullName: selectedAddress.fullName,
          line1: selectedAddress.line1,
          line2: selectedAddress.line2,
          city: selectedAddress.city,
          region: selectedAddress.region,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: state.phone,
        }
      : {
          fullName: state.fullName.trim(),
          line1: state.line1.trim(),
          line2: state.line2.trim() || null,
          city: state.city.trim(),
          region: state.region.trim(),
          postalCode: state.postalCode.trim(),
          country: state.country,
          phone: state.phone,
        };

    try {
      const res = await fetch(relayUrl("/orders/checkout"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email.trim().toLowerCase(),
          customerName: shippingAddress.fullName,
          phone: state.phone,
          shippingAddress,
          shippingCents,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Checkout failed (${res.status})`);
      }
      const order = (await res.json()) as { number: string };
      trackPurchase(
        items.map((i) => ({ id: i.productId, name: i.name, priceCents: i.priceCents, quantity: i.quantity })),
        totalCents,
        order.number,
      );
      await clear();
      router.push(`/orders/${order.number}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (ready && items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10">
        <div className="font-display text-2xl text-ink">Your bag is empty.</div>
        <p className="mt-2 text-sm text-muted">You need something in the bag to check out.</p>
        <Button href="/shop" variant="primary" className="mt-5">
          Browse shop
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div className="space-y-6">
        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Contact
          </legend>
          <p className="mb-4 text-xs text-muted">
            We&apos;ll email your order confirmation and tracking. Phone is used for delivery updates.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={state.email}
              onChange={(v) => patch("email", v)}
              onBlur={() => touch("email")}
              error={touched.email ? errors.email : undefined}
              placeholder="you@example.com"
            />
            <div>
              <label htmlFor="phone" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Phone <span className="text-red-600">*</span>
              </label>
              <div className="mt-2">
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry="PK"
                  countryCallingCodeEditable={false}
                  countrySelectProps={{ disabled: true }}
                  value={state.phone}
                  onChange={(v) => patch("phone", v ?? "")}
                  onBlur={() => touch("phone")}
                  placeholder="Phone number"
                  data-invalid={touched.phone && errors.phone ? "true" : "false"}
                />
              </div>
              {touched.phone && errors.phone ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Pick your country, then type the local number — we&apos;ll format it.
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Ship to
          </legend>

          {addresses.length ? (
            <div className="mb-5 space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                    selectedAddressId === a.id ? "border-ink bg-ink/5" : "border-line-strong hover:border-ink/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={a.id}
                    checked={selectedAddressId === a.id}
                    onChange={() => selectAddress(a.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-ink">
                      {a.label} · {a.fullName}
                    </div>
                    <div className="text-xs text-muted">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.region} {a.postalCode}
                    </div>
                  </div>
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                  selectedAddressId === "new" ? "border-ink bg-ink/5" : "border-line-strong hover:border-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="addressId"
                  value="new"
                  checked={selectedAddressId === "new"}
                  onChange={() => selectAddress("new")}
                  className="mt-0.5"
                />
                <div className="font-medium text-ink">Use a different address</div>
              </label>
            </div>
          ) : null}

          {selectedAddressId === "new" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                name="fullName"
                label="Full name"
                required
                autoComplete="name"
                value={state.fullName}
                onChange={(v) => patch("fullName", v)}
                onBlur={() => touch("fullName")}
                error={touched.fullName ? errors.fullName : undefined}
              />
              <div>
                <label htmlFor="country" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  Country <span className="text-red-600">*</span>
                </label>
                <select
                  id="country"
                  value={state.country}
                  onChange={(e) => patch("country", e.target.value as Country)}
                  onBlur={() => touch("country")}
                  required
                  autoComplete="country"
                  className="mt-2 h-11 w-full rounded-md border border-line-strong bg-background px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {touched.country && errors.country ? (
                  <p className="mt-1.5 text-xs text-red-600">{errors.country}</p>
                ) : null}
              </div>
              <Field
                name="line1"
                label="Address line 1"
                required
                autoComplete="address-line1"
                value={state.line1}
                onChange={(v) => patch("line1", v)}
                onBlur={() => touch("line1")}
                error={touched.line1 ? errors.line1 : undefined}
                className="md:col-span-2"
              />
              <Field
                name="line2"
                label="Apt, suite, etc. (optional)"
                autoComplete="address-line2"
                value={state.line2}
                onChange={(v) => patch("line2", v)}
                className="md:col-span-2"
              />
              <Field
                name="city"
                label="City"
                required
                autoComplete="address-level2"
                value={state.city}
                onChange={(v) => patch("city", v)}
                onBlur={() => touch("city")}
                error={touched.city ? errors.city : undefined}
              />
              <Field
                name="region"
                label="State / region"
                required
                autoComplete="address-level1"
                value={state.region}
                onChange={(v) => patch("region", v)}
                onBlur={() => touch("region")}
                error={touched.region ? errors.region : undefined}
              />
              <Field
                name="postalCode"
                label="Postal code"
                required
                autoComplete="postal-code"
                value={state.postalCode}
                onChange={(v) => patch("postalCode", v)}
                onBlur={() => touch("postalCode")}
                error={touched.postalCode ? errors.postalCode : undefined}
              />
            </div>
          ) : null}
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Payment
          </legend>
          <div className="flex items-start gap-3 rounded-md border border-ink bg-ink/5 p-3 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              checked
              readOnly
              aria-label="Cash on Delivery"
              className="mt-0.5"
            />
            <div className="min-w-0">
              <div className="font-medium text-ink">Cash on Delivery (COD)</div>
              <div className="mt-0.5 text-xs text-muted">
                Pay in cash to the courier when your order arrives. No card or online payment needed.
              </div>
            </div>
          </div>
        </fieldset>

        {submitError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}
      </div>

      <aside className="h-fit space-y-5">
        <div className="rounded-2xl border border-line-strong bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Order</div>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{i.name}</div>
                  <div className="text-xs text-muted">
                    {i.quantity} × {formatPrice(i.priceCents)}
                  </div>
                </div>
                <div className="font-mono text-ink tabular-nums">{formatPrice(i.lineTotalCents)}</div>
              </li>
            ))}
          </ul>
          <div className="my-5 h-px bg-line" />
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-mono text-ink tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-mono text-ink tabular-nums">
                {shippingCents === 0 ? "Free" : formatPrice(shippingCents)}
              </dd>
            </div>
          </dl>
          <div className="my-5 h-px bg-line" />
          <div className="flex items-end justify-between">
            <div className="font-display text-lg">Total</div>
            <div className="font-display text-2xl text-ink tabular-nums">{formatPrice(totalCents)}</div>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-5 w-full"
            disabled={submitting || items.length === 0 || !isValid}
          >
            {submitting
              ? "Placing order…"
              : !isValid
                ? "Complete the form to continue"
                : `Place order · ${formatPrice(totalCents)}`}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Pay {formatPrice(totalCents)} in cash on delivery — no payment is taken now. {settings.returnsWindowDays}-day return window applies.
            {!session && AUTH_UI_ENABLED ? (
              <>
                {" "}
                <Link href="/login" className="text-ink underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to save shipping details for next time.
              </>
            ) : null}
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  value,
  onChange,
  onBlur,
  error,
  className,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const invalid = !!error;
  return (
    <div className={className}>
      <label htmlFor={name} className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${name}-error` : undefined}
        className={`mt-2 h-11 w-full rounded-md border bg-background px-3.5 text-sm text-ink placeholder:text-muted focus:outline-none ${
          invalid
            ? "border-red-400 focus:border-red-500"
            : "border-line-strong focus:border-ink"
        }`}
      />
      {invalid ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
