import { adminServerFetch } from "@/lib/server-api";
import { formatNumber, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusPill } from "@/components/ui/status-pill";
import { DeleteCartButton } from "./cart-actions";

type CartItem = {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

type ActiveCart = {
  id: string;
  ownerType: "user" | "guest";
  user: { id: string; email: string; name: string | null; phone: string | null } | null;
  guestKey: string | null;
  items: CartItem[];
  subtotalCents: number;
  totalUnits: number;
  createdAt: string;
  updatedAt: string;
};

type ActiveCartsResponse = {
  summary: {
    totalCarts: number;
    totalUnits: number;
    totalCents: number;
    guestCarts: number;
    userCarts: number;
  };
  carts: ActiveCart[];
};

async function fetchActive(): Promise<ActiveCartsResponse | null> {
  try {
    return await adminServerFetch<ActiveCartsResponse>("/cart/active");
  } catch {
    return null;
  }
}

export default async function CartsPage() {
  const data = await fetchActive();

  if (!data) {
    return (
      <div className="card p-10 text-center">
        <div className="text-sm font-medium text-ink">Backend unreachable</div>
        <p className="mt-2 text-sm text-muted">
          Make sure <span className="font-mono text-ink">express-backend</span> is running.
        </p>
      </div>
    );
  }

  const { summary, carts } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Active carts"
        subtitle="Every cart with at least one item right now — signed-in customers and anonymous guests."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Active carts" value={formatNumber(summary.totalCarts)} sub={`${summary.userCarts} signed-in · ${summary.guestCarts} guests`} />
        <KpiCard label="Items in carts" value={formatNumber(summary.totalUnits)} />
        <KpiCard label="Cart value" value={formatPrice(summary.totalCents)} sub="Potential revenue" />
        <KpiCard
          label="Average cart"
          value={formatPrice(summary.totalCarts ? Math.round(summary.totalCents / summary.totalCarts) : 0)}
        />
      </div>

      {carts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-sm font-medium text-ink">No active carts right now</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            When a customer adds something to their bag, the cart shows up here with their email (if signed in) or a guest fingerprint.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map((c) => (
            <CartRow key={c.id} cart={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CartRow({ cart }: { cart: ActiveCart }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={cart.ownerType === "user" ? "user" : "guest"} />
            {cart.user ? (
              <span className="text-sm font-semibold text-ink">{cart.user.email}</span>
            ) : (
              <span className="text-sm font-semibold text-ink">Guest shopper</span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted">
            {cart.user?.name ? `${cart.user.name} · ` : ""}
            {cart.user?.phone ? `${cart.user.phone} · ` : ""}
            {cart.guestKey ? <span className="font-mono">key {cart.guestKey.slice(0, 10)}…</span> : null}
          </div>
          <div className="mt-1.5 text-xs text-muted tabular-nums">
            Last update {new Date(cart.updatedAt).toLocaleString()}
            <span className="mx-2 text-line-strong">·</span>
            Created {new Date(cart.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-xs font-medium text-muted">Cart value</div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink tabular-nums">
              {formatPrice(cart.subtotalCents)}
            </div>
            <div className="text-xs text-muted tabular-nums">{cart.totalUnits} item{cart.totalUnits === 1 ? "" : "s"}</div>
          </div>
          <DeleteCartButton cartId={cart.id} label={cart.user?.email ?? "Guest cart"} />
        </div>
      </div>

      <div className="p-3 md:p-0">
        <table className="w-full text-left text-sm table-cards">
          <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-2 font-medium">Product</th>
              <th className="px-5 py-2 font-medium">Unit price</th>
              <th className="px-5 py-2 font-medium">Qty</th>
              <th className="px-5 py-2 font-medium text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-b-0">
                <td className="px-5 py-2.5 text-ink" data-label="Product">{i.productName}</td>
                <td className="px-5 py-2.5 tabular-nums text-muted" data-label="Unit price">{formatPrice(i.unitPriceCents)}</td>
                <td className="px-5 py-2.5 tabular-nums text-ink" data-label="Qty">×{i.quantity}</td>
                <td className="px-5 py-2.5 text-right font-medium tabular-nums text-ink" data-label="Line total">{formatPrice(i.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
