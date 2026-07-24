"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminClientFetch } from "@/lib/admin-client";
import { formatPrice, getActiveCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  unitCostCents: number;
};

export function OrderItemsCard({
  id,
  items,
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
  actualShippingCostCents,
  profitCents,
}: {
  id: string;
  items: Item[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  actualShippingCostCents: number | null;
  profitCents: number;
}) {
  const router = useRouter();
  const { symbol } = getActiveCurrency();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [lines, setLines] = useState(() => toDraft(items));
  const [shipping, setShipping] = useState((shippingCents / 100).toString());
  const [tax, setTax] = useState((taxCents / 100).toString());

  function toDraft(src: Item[]) {
    return src.map((i) => ({
      id: i.id,
      price: (i.unitPriceCents / 100).toString(),
      cost: (i.unitCostCents / 100).toString(),
    }));
  }

  function startEdit() {
    setLines(toDraft(items));
    setShipping((shippingCents / 100).toString());
    setTax((taxCents / 100).toString());
    setEditing(true);
  }

  function patchLine(itemId: string, field: "price" | "cost", value: string) {
    setLines((prev) => prev.map((l) => (l.id === itemId ? { ...l, [field]: value } : l)));
  }

  async function save() {
    setPending(true);
    try {
      await adminClientFetch(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          items: lines.map((l) => ({
            id: l.id,
            unitPriceCents: toCents(l.price),
            unitCostCents: toCents(l.cost),
          })),
          shippingCents: toCents(shipping),
          taxCents: toCents(tax),
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <div className="text-sm font-semibold text-ink">Items</div>
          <div className="text-xs text-muted">{items.length} line items</div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditing(false)} variant="ghost" size="sm" disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <Button onClick={startEdit} variant="secondary" size="sm">
            Edit details
          </Button>
        )}
      </div>

      <ul>
        {items.map((item) => {
          const line = lines.find((l) => l.id === item.id)!;
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{item.productName}</div>
                {editing ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                    <MoneyInput label="Price" symbol={symbol} value={line.price} onChange={(v) => patchLine(item.id, "price", v)} />
                    <MoneyInput label="Cost" symbol={symbol} value={line.cost} onChange={(v) => patchLine(item.id, "cost", v)} />
                    <span className="text-muted">× {item.quantity}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted">{formatPrice(item.unitPriceCents)} × {item.quantity}</div>
                )}
              </div>
              <div className="shrink-0 font-medium tabular-nums text-ink">
                {formatPrice((editing ? toCents(line.price) : item.unitPriceCents) * item.quantity)}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="space-y-2 border-t border-line bg-surface-2 px-5 py-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotalCents)}</dd></div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Shipping (charged)</dt>
          <dd className="tabular-nums">
            {editing ? (
              <MoneyInput label="" symbol={symbol} value={shipping} onChange={setShipping} />
            ) : (
              formatPrice(shippingCents)
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Tax</dt>
          <dd className="tabular-nums">
            {editing ? <MoneyInput label="" symbol={symbol} value={tax} onChange={setTax} /> : formatPrice(taxCents)}
          </dd>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(totalCents)}</dd>
        </div>
        <div className="flex justify-between text-xs text-muted">
          <dt>Shipping cost (courier)</dt>
          <dd className="tabular-nums">{actualShippingCostCents != null ? formatPrice(actualShippingCostCents) : "Not set"}</dd>
        </div>
        <div className="flex justify-between text-xs text-muted">
          <dt>{actualShippingCostCents != null ? "Profit" : "Estimated profit"}</dt>
          <dd className="tabular-nums">{formatPrice(profitCents)}</dd>
        </div>
        {editing ? (
          <div className="pt-1 text-[11px] text-muted">Total and profit recalculate after Save.</div>
        ) : null}
      </dl>
    </div>
  );
}

function toCents(value: string): number {
  return Math.round(Number(value || 0) * 100);
}

function MoneyInput({
  label,
  symbol,
  value,
  onChange,
}: {
  label: string;
  symbol: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1">
      {label ? <span className="text-muted">{label}</span> : null}
      <span className="flex h-7 items-center rounded-md border border-line bg-surface px-1.5 focus-within:border-ink/30">
        <span className="text-muted">{symbol}</span>
        <input
          type="number"
          step="0.01"
          min={0}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ml-1 w-16 bg-transparent text-ink focus:outline-none"
        />
      </span>
    </label>
  );
}
