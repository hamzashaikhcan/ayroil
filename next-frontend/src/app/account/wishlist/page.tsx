"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { relayUrl } from "@/lib/api";
import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

type WishItem = {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    priceCents: number;
    images: string[] | null;
  };
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[] | null>(null);
  const [refresh, setRefresh] = useState(0);
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;
    fetch(relayUrl("/wishlist"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: WishItem[]) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [refresh]);

  async function onRemove(w: WishItem) {
    const ok = await confirm({
      title: "Remove from wishlist?",
      description: "You can add it back from the product page any time.",
      targetName: w.product.name,
      destructive: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    await fetch(relayUrl(`/wishlist/${w.product.id}`), { method: "DELETE", credentials: "include" });
    setRefresh((n) => n + 1);
  }

  if (!items) return <div className="rounded-2xl border border-line bg-surface p-8 text-sm text-muted">Loading…</div>;
  if (!items.length)
    return (
      <div className="rounded-2xl border border-line bg-surface p-10">
        <div className="font-display text-xl text-ink">Nothing in the wishlist.</div>
        <p className="mt-2 text-sm text-muted">Save products you are watching and we will keep them here.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((w) => (
        <div key={w.id} className="rounded-2xl border border-line bg-surface p-4">
          <ProductThumb image={w.product.images?.[0]} slug={w.product.slug} name={w.product.name} className="aspect-square" />
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <Link href={`/shop/${w.product.slug}`} className="font-display text-base text-ink hover:underline underline-offset-4">{w.product.name}</Link>
              <div className="mt-0.5 text-xs text-muted">{w.product.tagline ?? ""}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-ink">{formatPrice(w.product.priceCents)}</div>
              <button onClick={() => onRemove(w)} className="mt-2 text-xs text-muted underline-offset-4 hover:text-red-600 hover:underline">Remove</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
