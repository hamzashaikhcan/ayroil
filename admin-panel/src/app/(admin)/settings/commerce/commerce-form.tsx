"use client";

import { Card, Field, NumberField } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import { CURRENCIES, type SettingsLike } from "../_shared/types";
import { SwitchField } from "@/components/ui/switch-field";

type CommerceSlice = Pick<
  SettingsLike,
  | "currencyCode"
  | "currencySymbol"
  | "currencyLocale"
  | "freeShippingThresholdCents"
  | "standardShippingCents"
  | "estStandardDays"
  | "returnsWindowDays"
  | "returnsPolicyUrl"
  | "productTimerEnabled"
  | "productTimerDurationSeconds"
  | "productTimerDiscountPercent"
  | "productTimerMessage"
>;

export function CommerceForm({ initial }: { initial: SettingsLike }) {
  const slice: CommerceSlice = {
    currencyCode: initial.currencyCode,
    currencySymbol: initial.currencySymbol,
    currencyLocale: initial.currencyLocale,
    freeShippingThresholdCents: initial.freeShippingThresholdCents,
    standardShippingCents: initial.standardShippingCents,
    estStandardDays: initial.estStandardDays,
    returnsWindowDays: initial.returnsWindowDays,
    returnsPolicyUrl: initial.returnsPolicyUrl,
    productTimerEnabled: initial.productTimerEnabled,
    productTimerDurationSeconds: initial.productTimerDurationSeconds,
    productTimerDiscountPercent: initial.productTimerDiscountPercent,
    productTimerMessage: normalizeTimerMessage(initial.productTimerMessage),
  };

  const { s, setS, patch, pending, saved, error, onSubmit } = useSettingsSave<CommerceSlice>(slice);

  function pickCurrency(code: string) {
    const c = CURRENCIES.find((x) => x.code === code);
    if (!c) return;
    setS((prev) => ({
      ...prev,
      currencyCode: c.code,
      currencySymbol: c.symbol,
      currencyLocale: c.locale,
    }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card
        title="Currency"
        subtitle="Pick a preset or set a custom currency. Existing prices are not converted — re-enter products if you switch currency."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted">Preset</label>
            <select
              value={s.currencyCode}
              onChange={(e) => pickCurrency(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
              {!CURRENCIES.find((c) => c.code === s.currencyCode) ? (
                <option value={s.currencyCode}>{s.currencyCode} (custom)</option>
              ) : null}
            </select>
          </div>
          <Field
            label="Currency code"
            value={s.currencyCode}
            onChange={(v) => patch("currencyCode", v.toUpperCase())}
            placeholder="USD"
          />
          <Field label="Symbol" value={s.currencySymbol} onChange={(v) => patch("currencySymbol", v)} placeholder="$" />
          <Field
            label="Locale (BCP-47)"
            value={s.currencyLocale}
            onChange={(v) => patch("currencyLocale", v)}
            placeholder="en-US"
          />
        </div>
        <div className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">
          Preview:{" "}
          <span className="font-mono text-ink">
            {previewMoney(2400, s.currencyCode, s.currencySymbol, s.currencyLocale)}
          </span>{" "}
          ·{" "}
          <span className="font-mono text-ink">
            {previewMoney(123450, s.currencyCode, s.currencySymbol, s.currencyLocale)}
          </span>
        </div>
      </Card>

      <Card title="Shipping" subtitle={`Enter prices in whole ${s.currencyCode}.`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MoneyField
            label="Free shipping over"
            value={s.freeShippingThresholdCents}
            onChange={(v) => patch("freeShippingThresholdCents", v)}
            symbol={s.currencySymbol}
          />
          <MoneyField
            label="Standard shipping cost"
            value={s.standardShippingCents}
            onChange={(v) => patch("standardShippingCents", v)}
            symbol={s.currencySymbol}
          />
          <Field
            label="Standard est. days"
            value={s.estStandardDays}
            onChange={(v) => patch("estStandardDays", v)}
            placeholder="3–5"
          />
        </div>
      </Card>

      <Card title="Returns">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Return window (days)"
            value={s.returnsWindowDays}
            onChange={(v) => patch("returnsWindowDays", v)}
          />
          <Field
            label="Policy URL"
            value={s.returnsPolicyUrl}
            onChange={(v) => patch("returnsPolicyUrl", v)}
            placeholder="/policies/returns"
          />
        </div>
      </Card>

      <Card
        title="Product detail timer"
        subtitle="Optional countdown shown above the product purchase box. Use it as a short urgency nudge."
      >
        <SwitchField
          checked={s.productTimerEnabled}
          onChange={(checked) => patch("productTimerEnabled", checked)}
          label="Show timer on product detail pages"
          description="Hidden when off. The timer restarts for each visitor when the page loads."
        />

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px_180px]">
          <Field
            label="Timer message"
            value={s.productTimerMessage}
            onChange={(v) => patch("productTimerMessage", v)}
            placeholder="Offer ends in"
          />
          <NumberField
            label="Discount (%)"
            value={s.productTimerDiscountPercent}
            onChange={(v) => patch("productTimerDiscountPercent", Math.max(1, Math.min(95, v)))}
          />
          <NumberField
            label="Duration (seconds)"
            value={s.productTimerDurationSeconds}
            onChange={(v) => patch("productTimerDurationSeconds", Math.max(1, Math.min(86400, v)))}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "15 sec", value: 15 },
            { label: "1 min", value: 60 },
            { label: "5 min", value: 300 },
            { label: "15 min", value: 900 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => patch("productTimerDurationSeconds", preset.value)}
              className="h-8 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}

function previewMoney(cents: number, code: string, symbol: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${symbol}${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
  }
}

function normalizeTimerMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed === "Your cart price is reserved for" || trimmed === "Buy before the timer ends to claim this discount") {
    return "Offer ends in";
  }
  return trimmed;
}

function MoneyField({
  label,
  value,
  onChange,
  symbol,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  symbol: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <div className="mt-1.5 flex h-9 items-center rounded-md border border-line bg-surface-2 px-3 text-sm focus-within:border-ink/30 focus-within:bg-surface">
        <span className="text-muted">{symbol}</span>
        <input
          type="number"
          step="0.01"
          min={0}
          value={(value / 100).toString()}
          onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * 100))}
          className="ml-1 w-full bg-transparent text-sm text-ink focus:outline-none"
        />
      </div>
    </div>
  );
}
