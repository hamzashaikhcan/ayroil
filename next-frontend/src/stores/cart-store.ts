"use client";

import { create } from "zustand";
import { relayUrl, type CartView } from "@/lib/api";

type State = {
  cart: CartView | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  add: (
    productId: string,
    name: string,
    priceCents: number,
    qty?: number,
    image?: string | null,
    slug?: string,
  ) => Promise<void>;
  setQty: (itemId: string, qty: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const EMPTY: CartView = { id: "", items: [], subtotalCents: 0, totalUnits: 0 };

async function call<T = CartView>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(relayUrl(path), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

export const useCart = create<State>((set, get) => ({
  cart: null,
  ready: false,
  hydrate: async () => {
    try {
      const cart = await call<CartView>("/cart");
      set({ cart, ready: true });
    } catch {
      set({ cart: EMPTY, ready: true });
    }
  },
  add: async (productId, name, priceCents, qty = 1, image = null, slug = "") => {
    // optimistic: bump locally first
    const prev = get().cart ?? EMPTY;
    const existing = prev.items.find((i) => i.productId === productId);
    const optimistic: CartView = existing
      ? {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + qty, lineTotalCents: (i.quantity + qty) * i.priceCents }
              : i,
          ),
          subtotalCents: prev.subtotalCents + priceCents * qty,
          totalUnits: prev.totalUnits + qty,
        }
      : {
          ...prev,
          items: [
            ...prev.items,
            {
              id: `tmp-${productId}`,
              productId,
              slug,
              name,
              priceCents,
              image,
              quantity: qty,
              lineTotalCents: priceCents * qty,
            },
          ],
          subtotalCents: prev.subtotalCents + priceCents * qty,
          totalUnits: prev.totalUnits + qty,
        };
    set({ cart: optimistic });
    try {
      const cart = await call<CartView>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: qty }),
      });
      set({ cart });
    } catch {
      set({ cart: prev });
    }
  },
  setQty: async (itemId, qty) => {
    const prev = get().cart ?? EMPTY;
    const optimistic: CartView = {
      ...prev,
      items: qty === 0
        ? prev.items.filter((i) => i.id !== itemId)
        : prev.items.map((i) =>
            i.id === itemId
              ? { ...i, quantity: qty, lineTotalCents: qty * i.priceCents }
              : i,
          ),
    };
    optimistic.subtotalCents = optimistic.items.reduce((a, i) => a + i.lineTotalCents, 0);
    optimistic.totalUnits = optimistic.items.reduce((a, i) => a + i.quantity, 0);
    set({ cart: optimistic });
    try {
      const cart = await call<CartView>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: qty }),
      });
      set({ cart });
    } catch {
      set({ cart: prev });
    }
  },
  remove: async (itemId) => {
    const prev = get().cart ?? EMPTY;
    const optimistic: CartView = {
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    };
    optimistic.subtotalCents = optimistic.items.reduce((a, i) => a + i.lineTotalCents, 0);
    optimistic.totalUnits = optimistic.items.reduce((a, i) => a + i.quantity, 0);
    set({ cart: optimistic });
    try {
      const cart = await call<CartView>(`/cart/items/${itemId}`, { method: "DELETE" });
      set({ cart });
    } catch {
      set({ cart: prev });
    }
  },
  clear: async () => {
    const prev = get().cart;
    set({ cart: EMPTY });
    try {
      const cart = await call<CartView>("/cart", { method: "DELETE" });
      set({ cart });
    } catch {
      if (prev) set({ cart: prev });
    }
  },
}));
