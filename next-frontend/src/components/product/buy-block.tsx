"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/api";
import { useCart } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-context";

export function BuyBlock({
  product,
  sentinelId,
  offer,
}: {
  product: Product;
  sentinelId?: string;
  offer?: { discountPercent: number; expiresAt: string };
}) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const cart = useCart((s) => s.cart);
  const settings = useSettings();
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [buying, setBuying] = useState(false);

  const soldOut = product.stock <= 0;
  const lineTotal = product.priceCents * qty;
  const cartSubtotal = cart?.subtotalCents ?? 0;
  const projectedSubtotal = cartSubtotal + lineTotal;
  const freeAt = settings.freeShippingThresholdCents;
  const toFree = Math.max(0, freeAt - projectedSubtotal);
  const hitFree = settings.freeShippingEnabled || projectedSubtotal >= freeAt;

  async function onAdd() {
    if (soldOut) return;
    setPending(true);
    try {
      await add(
        product.id,
        product.name,
        product.priceCents,
        qty,
        product.images?.[0] ?? null,
        product.slug,
        offer,
      );
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } finally {
      setPending(false);
    }
  }

  async function onBuyNow() {
    if (soldOut) return;
    setBuying(true);
    try {
      await add(
        product.id,
        product.name,
        product.priceCents,
        qty,
        product.images?.[0] ?? null,
        product.slug,
        offer,
      );
      router.push("/checkout");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div id={sentinelId} className="mt-6 rounded-2xl border border-line bg-surface p-5">
      {/* Quantity + Add to cart on one row */}
      <div className="flex flex-wrap items-stretch gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, product.stock)} disabled={soldOut} />
        <Button
          variant={done ? "accent" : "primary"}
          size="lg"
          onClick={onAdd}
          disabled={pending || soldOut}
          className="flex-1 min-w-45"
        >
          {soldOut
            ? "Sold out"
            : done
              ? "Added ✓"
              : pending
                ? "Adding…"
                : `Add to cart · ${formatPrice(lineTotal)}`}
        </Button>
      </div>

      {/* Buy now sits below as the secondary path */}
      <Button
        variant="secondary"
        size="lg"
        onClick={onBuyNow}
        disabled={buying || soldOut}
        className="mt-3 w-full"
      >
        {buying ? "Opening checkout…" : "Buy now"}
      </Button>

      {/* Free-ship hint */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${hitFree ? "bg-accent-deep" : "bg-muted"}`}
          aria-hidden
        />
        {hitFree ? (
          <span>
            <span className="font-medium text-ink">Free shipping</span> on this order.
          </span>
        ) : (
          <span>
            Add{" "}
            <span className="font-mono font-medium text-ink">{formatPrice(toFree)}</span>{" "}
            for free shipping (over{" "}
            <span className="font-mono">{formatPrice(freeAt)}</span>).
          </span>
        )}
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
  max,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  disabled?: boolean;
}) {
  function clamp(n: number) {
    return Math.max(1, Math.min(max, Math.floor(n) || 1));
  }
  return (
    <div className="inline-flex h-12 items-stretch overflow-hidden rounded-md border border-line-strong bg-surface">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
        className="flex w-10 items-center justify-center text-ink hover:bg-ink/5 disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        disabled={disabled}
        aria-label="Quantity"
        className="w-12 bg-transparent text-center font-mono text-sm text-ink focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="flex w-10 items-center justify-center text-ink hover:bg-ink/5 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
