export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Same-origin relay base — routes through Next /api/relay so the
 *  user's Auth.js session can be converted to a backend Bearer JWT. */
export function relayUrl(path: string): string {
  return `/api/relay?path=${encodeURIComponent(path)}`;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(relayUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  compareAtCents: number | null;
  costCents: number;
  stock: number;
  sku: string | null;
  active: boolean;
  recommended: boolean;
  sortOrder: number | null;
  images: string[];
  highlights: string[];
  ingredients: { name: string; description: string }[];
  faqs: { q: string; a: string }[];
  reviewCount?: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
};

export type CartView = {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    slug: string;
    name: string;
    priceCents: number;
    image: string | null;
    quantity: number;
    lineTotalCents: number;
  }>;
  subtotalCents: number;
  totalUnits: number;
};
