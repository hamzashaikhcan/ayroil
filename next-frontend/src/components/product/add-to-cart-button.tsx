"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart-store";
import type { Product } from "@/lib/api";

export function AddToCartButton({ product, size = "lg" }: { product: Product; size?: "md" | "lg" }) {
  const add = useCart((s) => s.add);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onClick() {
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
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={done ? "accent" : "primary"} size={size} onClick={onClick} disabled={pending}>
      {done ? "Added ✓" : pending ? "Adding…" : `Add to cart`}
    </Button>
  );
}
