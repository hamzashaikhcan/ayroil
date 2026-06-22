"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BuyBlock } from "@/components/product/buy-block";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { ProductUrgencyTimer } from "@/components/product/product-urgency-timer";

export function ProductPurchasePanel({
  product,
  timer,
  estimatedShippingDays,
  sentinelId,
  children,
}: {
  product: Product;
  timer: {
    enabled: boolean;
    durationSeconds: number;
    discountPercent: number;
    message: string;
    storageKey: string;
  };
  estimatedShippingDays: string;
  sentinelId: string;
  children: ReactNode;
}) {
  const [expired, setExpired] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const discountActive = timer.enabled && timer.discountPercent > 0 && !expired;

  const effectivePriceCents = discountActive
    ? Math.max(0, Math.round(product.priceCents * (100 - timer.discountPercent) / 100))
    : product.priceCents;

  const purchaseProduct = useMemo(
    () =>
      discountActive
        ? { ...product, priceCents: effectivePriceCents, compareAtCents: product.priceCents }
        : product,
    [discountActive, effectivePriceCents, product],
  );

  const onExpire = useCallback(() => {
    setExpired(true);
    setDeadline(null);
  }, []);

  const onDeadline = useCallback((nextDeadline: number) => {
    setDeadline(nextDeadline);
  }, []);

  const offer = discountActive && deadline
    ? { discountPercent: timer.discountPercent, expiresAt: new Date(deadline).toISOString() }
    : undefined;

  return (
    <>
      {discountActive ? (
        <div className="mb-6">
          <ProductUrgencyTimer
            durationSeconds={timer.durationSeconds}
            discountPercent={timer.discountPercent}
            message={timer.message}
            priceCents={product.priceCents}
            storageKey={timer.storageKey}
            onExpire={onExpire}
            onDeadline={onDeadline}
          />
        </div>
      ) : expired ? (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Offer expired
          </div>
          <p className="mt-1 text-sm text-ink">The limited-time discount for this visit has ended.</p>
        </div>
      ) : null}

      {children}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="font-display text-3xl text-ink">{formatPrice(effectivePriceCents)}</div>
        {discountActive ? (
          <div className="font-mono text-sm text-muted line-through">{formatPrice(product.priceCents)}</div>
        ) : product.compareAtCents ? (
          <div className="font-mono text-sm text-muted line-through">{formatPrice(product.compareAtCents)}</div>
        ) : null}
        <span className="ml-1">
          <Badge tone={product.stock > 0 ? "accent" : "outline"}>
            {product.stock > 0
              ? product.stock < 10
                ? `Only ${product.stock} left`
                : `In stock · ships in ${estimatedShippingDays}d`
              : "Sold out"}
          </Badge>
        </span>
      </div>

      <BuyBlock product={purchaseProduct} sentinelId={sentinelId} offer={offer} />
      <StickyBuyBar product={purchaseProduct} sentinelId={sentinelId} offer={offer} />
    </>
  );
}
