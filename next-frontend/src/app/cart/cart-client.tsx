"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product/product-thumb";
import { useCart } from "@/stores/cart-store";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/utils";

type Item = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  lineTotalCents: number;
};

export function CartClient() {
  const cart = useCart((s) => s.cart);
  const ready = useCart((s) => s.ready);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const confirm = useConfirm();
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalCents ?? 0;

  async function onRemove(i: Item) {
    const ok = await confirm({
      title: "Remove from your bag?",
      description: "You can add it back from the product page any time.",
      targetName: `${i.name} · ${i.quantity}×`,
      destructive: true,
      confirmLabel: "Remove",
    });
    if (ok) await remove(i.id);
  }

  async function onClear() {
    if (!items.length) return;
    const ok = await confirm({
      title: "Clear your entire bag?",
      description:
        "This removes every item in your bag. You'll need to add them back individually if you change your mind.",
      destructive: true,
      confirmLabel: "Clear bag",
    });
    if (ok) await clear();
  }

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted"><span className="marker-dot">Bag</span></div>
            <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-5xl">Your bag</h1>
          </div>
          {items.length > 0 ? (
            <button
              onClick={onClear}
              className="text-xs font-medium text-muted underline-offset-4 hover:text-red-600 hover:underline"
            >
              Clear bag
            </button>
          ) : null}
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-sm text-muted">Loading bag…</div>
        ) : items.length === 0 ? (
          <div className="grid grid-cols-1 gap-8 rounded-2xl border border-line bg-surface p-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="font-display text-2xl text-ink">Empty bag.</div>
              <p className="mt-2 max-w-md text-sm text-muted">Add something from the shop to get started.</p>
            </div>
            <Button href="/shop" variant="primary">Browse shop</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-5 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[112px_1fr_auto_auto]">
                  <div className="h-22 w-22 overflow-hidden rounded-lg">
                    <ProductThumb image={i.image} slug={i.slug || i.productId} name={i.name} className="aspect-square" sizes="112px" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/shop/${i.slug}`} className="font-display text-base text-ink hover:underline underline-offset-4">{i.name}</Link>
                    <div className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">{formatPrice(i.priceCents)} ea</div>
                  </div>
                  <div className="inline-flex items-center rounded-md border border-line-strong bg-background">
                    <button onClick={() => setQty(i.id, i.quantity - 1)} className="h-9 w-9 text-ink hover:bg-ink/5" aria-label="Decrease">−</button>
                    <span className="w-10 text-center font-mono text-sm">{i.quantity}</span>
                    <button onClick={() => setQty(i.id, i.quantity + 1)} className="h-9 w-9 text-ink hover:bg-ink/5" aria-label="Increase">+</button>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-mono text-sm text-ink">{formatPrice(i.lineTotalCents)}</div>
                    <button onClick={() => onRemove(i)} className="text-xs text-muted underline-offset-4 hover:text-red-600 hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <aside className="h-fit rounded-2xl border border-line-strong bg-surface p-6">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Order summary</div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-mono text-ink">{formatPrice(subtotal)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted">Shipping</dt><dd className="font-mono text-ink">Calculated at checkout</dd></div>
              </dl>
              <div className="my-5 h-px bg-line" />
              <div className="flex items-end justify-between">
                <div className="font-display text-lg">Estimated total</div>
                <div className="font-display text-2xl text-ink">{formatPrice(subtotal)}</div>
              </div>
              <Button href="/checkout" variant="primary" size="lg" className="mt-5 w-full">Checkout</Button>
            </aside>
          </div>
        )}
      </Container>
    </section>
  );
}
