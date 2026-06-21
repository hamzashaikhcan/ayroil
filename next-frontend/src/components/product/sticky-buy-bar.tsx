"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { useCart } from "@/stores/cart-store";
import { ProductArt } from "@/components/product/product-art";
import { formatPrice } from "@/lib/utils";

/**
 * Slim purchase bar that pins to the bottom of the viewport once the user
 * scrolls past the main `BuyBlock`. Observes a sentinel element by id.
 *
 * Dark theme — high-contrast ink shell with a sapphire-blue primary action,
 * so it reads as a distinct system action layer rather than another page card.
 */
export function StickyBuyBar({
  product,
  sentinelId,
}: {
  product: Product;
  sentinelId: string;
}) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [buying, setBuying] = useState(false);
  const soldOut = product.stock <= 0;
  const image = product.images?.[0] ?? null;

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  async function onAdd() {
    if (soldOut) return;
    setPending(true);
    try {
      await add(
        product.id,
        product.name,
        product.priceCents,
        1,
        product.images?.[0] ?? null,
        product.slug,
      );
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
        1,
        product.images?.[0] ?? null,
        product.slug,
      );
      router.push("/checkout");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto w-full max-w-5xl px-2 pb-2 sm:px-3 sm:pb-3">
        <div
          className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md sm:gap-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,22,30,0.96) 0%, rgba(10,12,18,0.96) 100%)",
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5 pl-1 sm:gap-3">
            <div className="relative h-11 w-11 flex-none overflow-hidden rounded-lg bg-white/5 sm:h-12 sm:w-12">
              {image ? (
                <Image src={image} alt={product.name} fill sizes="48px" className="object-cover" />
              ) : (
                <ProductArt seed={product.slug} label={product.name} className="aspect-square" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm text-background truncate sm:text-sm">
                {product.name}
              </div>
              <div className="font-mono text-xs tabular-nums text-background/60">
                {formatPrice(product.priceCents)}
              </div>
            </div>
          </div>

          <div className="flex flex-none items-center gap-1.5 sm:gap-2">
            {/* Add to cart — icon on phone, text label on tablet+. Always
                rendered so users can add without committing to checkout. */}
            <button
              type="button"
              onClick={onAdd}
              disabled={pending || soldOut}
              aria-label={soldOut ? "Sold out" : pending ? "Adding to cart" : "Add to cart"}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-white/[0.12] bg-white/[0.06] px-2.5 text-sm font-medium text-background transition-colors hover:bg-white/[0.12] disabled:opacity-40 sm:px-4"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                aria-hidden
                className="flex-none sm:hidden"
              >
                <path
                  d="M2 3h1.5l1 6.3a1 1 0 001 .85h5a1 1 0 001-.8L12.5 5H4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="5.5" cy="12" r="0.75" fill="currentColor" />
                <circle cx="10" cy="12" r="0.75" fill="currentColor" />
              </svg>
              <span className="hidden whitespace-nowrap sm:inline">
                {soldOut ? "Sold out" : pending ? "Adding…" : "Add to cart"}
              </span>
            </button>

            {/* Buy now — primary action, blue accent. Text shortens to "Buy"
                on phone so it never overflows. */}
            <button
              type="button"
              onClick={onBuyNow}
              disabled={buying || soldOut}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_14px_-4px_rgba(43,108,247,0.55)] transition-colors disabled:opacity-50 sm:px-5"
              style={{
                background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
              }}
            >
              {soldOut ? (
                "Sold out"
              ) : buying ? (
                "Opening…"
              ) : (
                <>
                  <span className="sm:hidden">Buy</span>
                  <span className="hidden sm:inline">Buy now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
