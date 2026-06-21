"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { ProductThumb } from "@/components/product/product-thumb";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSettings } from "@/components/providers/settings-context";

type DrawerItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  lineTotalCents: number;
};

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart((s) => s.cart);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const confirm = useConfirm();

  async function onRemove(i: DrawerItem) {
    const ok = await confirm({
      title: "Remove from your bag?",
      description: "You can add it back from the product page any time.",
      targetName: `${i.name} · ${i.quantity}×`,
      destructive: true,
      confirmLabel: "Remove",
    });
    if (ok) await remove(i.id);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const settings = useSettings();
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalCents ?? 0;
  const freeAt = settings.freeShippingThresholdCents;
  const toFree = Math.max(0, freeAt - subtotal);

  return (
    <div className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-ink/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line-strong bg-surface shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Cart</div>
            <div className="font-display mt-1 text-xl text-ink">Your bag</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong text-ink hover:bg-ink/5">
            ✕
          </button>
        </div>

        {toFree > 0 ? (
          <div className="border-b border-line bg-ink/[0.03] px-5 py-3 text-xs text-ink">
            Add <span className="font-mono">{formatPrice(toFree)}</span> for free shipping.
          </div>
        ) : items.length ? (
          <div className="border-b border-line bg-accent/30 px-5 py-3 text-xs text-ink">
            Free shipping unlocked.
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-xl border border-line bg-background p-8 text-center">
              <div className="font-display text-lg text-ink">Your bag is empty.</div>
              <p className="mt-2 text-sm text-muted">Add something from the shop to get started.</p>
              <Button href="/shop" variant="primary" size="sm" className="mt-5">Browse shop</Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-xl border border-line bg-background p-3">
                  <div className="h-18 w-18 overflow-hidden rounded-lg">
                    <ProductThumb image={i.image} slug={i.slug || i.productId} name={i.name} className="aspect-square" sizes="72px" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/shop/${i.slug}`} className="font-display text-sm text-ink hover:underline underline-offset-4 truncate block">{i.name}</Link>
                    <div className="mt-0.5 font-mono text-xs uppercase tracking-[0.18em] text-muted">{formatPrice(i.priceCents)} ea</div>
                    <div className="mt-2 inline-flex items-center rounded-md border border-line-strong">
                      <button onClick={() => setQty(i.id, i.quantity - 1)} className="h-7 w-7 text-ink hover:bg-ink/5" aria-label="Decrease">−</button>
                      <span className="w-8 text-center font-mono text-xs">{i.quantity}</span>
                      <button onClick={() => setQty(i.id, i.quantity + 1)} className="h-7 w-7 text-ink hover:bg-ink/5" aria-label="Increase">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-mono text-sm text-ink">{formatPrice(i.lineTotalCents)}</div>
                    <button onClick={() => onRemove(i)} className="text-xs text-muted hover:text-red-600 underline-offset-4 hover:underline">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-display text-xl text-ink">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">Shipping and tax calculated at checkout.</p>
          <Button href="/checkout" variant="primary" size="lg" className="mt-4 w-full">Checkout</Button>
          <Button href="/cart" variant="secondary" size="md" className="mt-2 w-full">View cart</Button>
        </div>
      </aside>
    </div>
  );
}
