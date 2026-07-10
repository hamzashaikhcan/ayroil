import jwt from "jsonwebtoken";
import { auth } from "@/auth";
import { API_URL, type RangePreset } from "./api";

/**
 * Mint a short-lived plain JWT signed with the admin secret + admin audience
 * and forward it as a Bearer token. Admin tokens never validate against
 * storefront routes and vice versa.
 */
export async function adminServerFetch<T = unknown>(path: string): Promise<T> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const secret = process.env.AUTH_SECRET_ADMIN ?? "";
  const token = jwt.sign(
    { sub: session.user.id, email: session.user.email, role: session.user.role },
    secret,
    { expiresIn: 60, audience: "admin" },
  );
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export type OverviewKpis = {
  revenueCents: number;
  profitCents: number;
  totalOrders: number;
  aovCents: number;
  unitsSold: number;
  newUsers: number;
  totalUsers: number;
  totalProducts: number;
};

export type RecentOrder = {
  id: string;
  number: string;
  customerName: string;
  email: string;
  totalCents: number;
  status: string;
  createdAt: string;
  user: { email: string } | null;
};

export type OverviewResponse = {
  range: { from: string; to: string };
  bucket: "day" | "week" | "month";
  kpis: OverviewKpis;
  recentOrders: RecentOrder[];
};

export type TimeseriesPoint = {
  bucket: string;
  orders: number;
  revenueCents: number;
  profitCents: number;
};

export type TopProduct = {
  productName: string;
  units: number;
  revenueCents: number;
};

function rangeQs(preset: RangePreset | undefined, from: string | undefined, to: string | undefined) {
  const p = preset ?? "month";
  const params = new URLSearchParams({ preset: p });
  if (p === "custom") {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  }
  return params.toString();
}

export type SidebarCounts = {
  newOrders: number;
  activeCarts: number;
  products: number;
  reviews: number;
};

export async function fetchSidebarCounts(): Promise<SidebarCounts | null> {
  try {
    return await adminServerFetch<SidebarCounts>("/analytics/counts");
  } catch {
    return null;
  }
}

export async function fetchOverview(preset?: RangePreset, from?: string, to?: string): Promise<OverviewResponse | null> {
  try {
    return await adminServerFetch<OverviewResponse>(`/analytics/overview?${rangeQs(preset, from, to)}`);
  } catch {
    return null;
  }
}

export async function fetchTimeseries(preset?: RangePreset, from?: string, to?: string): Promise<{ bucket: string; series: TimeseriesPoint[] } | null> {
  try {
    return await adminServerFetch(`/analytics/orders-timeseries?${rangeQs(preset, from, to)}`);
  } catch {
    return null;
  }
}

export async function fetchTopProducts(preset?: RangePreset, from?: string, to?: string): Promise<TopProduct[]> {
  try {
    return await adminServerFetch<TopProduct[]>(`/analytics/top-products?${rangeQs(preset, from, to)}`);
  } catch {
    return [];
  }
}

export async function fetchOrders(): Promise<RecentOrder[]> {
  try {
    return await adminServerFetch<RecentOrder[]>(`/orders`);
  } catch {
    return [];
  }
}

export type AdminReview = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  visible: boolean;
  createdAt: string;
  product: { id: string; slug: string; name: string } | null;
  order: { id: string; number: string } | null;
};

export type AdminReviewList = {
  total: number;
  page: number;
  pageCount: number;
  items: AdminReview[];
};

export async function fetchReviews(
  status: "all" | "visible" | "hidden" = "all",
  page = 1,
): Promise<AdminReviewList> {
  try {
    return await adminServerFetch<AdminReviewList>(`/reviews?status=${status}&page=${page}`);
  } catch {
    return { total: 0, page: 1, pageCount: 1, items: [] };
  }
}

export async function fetchProducts(): Promise<Array<{
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  active: boolean;
  sku: string | null;
  sortOrder: number | null;
  createdAt: string;
}>> {
  try {
    return await adminServerFetch(`/products?all=1`);
  } catch {
    return [];
  }
}

export async function fetchUsers(): Promise<Array<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  createdAt: string;
}>> {
  try {
    return await adminServerFetch(`/users`);
  } catch {
    return [];
  }
}
