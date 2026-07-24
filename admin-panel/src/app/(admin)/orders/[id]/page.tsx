import Link from "next/link";
import { notFound } from "next/navigation";
import { adminServerFetch } from "@/lib/server-api";
import { formatPrice } from "@/lib/utils";
import { OrderActions } from "./order-actions";
import { StatusPill } from "@/components/ui/status-pill";

type Order = {
  id: string;
  number: string;
  customerName: string;
  email: string;
  phone: string | null;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  costCents: number;
  actualShippingCostCents: number | null;
  profitCents: number;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone?: string | null;
  };
  items: { productName: string; quantity: number; unitPriceCents: number }[];
  createdAt: string;
  notes: string | null;
  trackingNumber: string | null;
};

export default async function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  let order: Order | null = null;
  try {
    order = await adminServerFetch<Order>(`/orders/${id}`);
  } catch {
    notFound();
  }
  if (!order) notFound();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="min-w-0">
          <Link href="/orders" className="text-xs text-muted hover:text-ink">← Back to orders</Link>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Order {order.number}</h2>
            <StatusPill value={order.status} />
          </div>
          <div className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <OrderActions
          id={order.id}
          status={order.status}
          trackingNumber={order.trackingNumber}
          actualShippingCostCents={order.actualShippingCostCents}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <div className="card">
            <div className="border-b border-line px-5 py-3.5">
              <div className="text-sm font-semibold text-ink">Items</div>
              <div className="text-xs text-muted">{order.items.length} line items</div>
            </div>
            <ul>
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center justify-between border-b border-line px-5 py-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-ink">{i.productName}</div>
                    <div className="text-xs text-muted">{formatPrice(i.unitPriceCents)} × {i.quantity}</div>
                  </div>
                  <div className="font-medium tabular-nums text-ink">{formatPrice(i.unitPriceCents * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line bg-surface-2 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping (charged)</dt><dd className="tabular-nums">{formatPrice(order.shippingCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular-nums">{formatPrice(order.taxCents)}</dd></div>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.totalCents)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Shipping cost (courier)</dt>
                <dd className="tabular-nums">
                  {order.actualShippingCostCents != null ? formatPrice(order.actualShippingCostCents) : "Not set"}
                </dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>{order.actualShippingCostCents != null ? "Profit" : "Estimated profit"}</dt>
                <dd className="tabular-nums">{formatPrice(order.profitCents)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="text-xs font-medium text-muted">Customer</div>
            <div className="mt-2 text-sm font-medium text-ink">{order.customerName}</div>
            <div className="mt-0.5 text-xs text-muted">{order.email}</div>
            {order.phone ? <div className="text-xs text-muted">{order.phone}</div> : null}
          </div>
          <div className="card p-5">
            <div className="text-xs font-medium text-muted">Shipping address</div>
            <div className="mt-2 text-sm text-ink">{order.shippingAddress.fullName}</div>
            <div className="text-xs text-muted">
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            </div>
            <div className="text-xs text-muted">
              {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
            </div>
            <div className="text-xs text-muted">{order.shippingAddress.country}</div>
          </div>
          {order.notes ? (
            <div className="card p-5">
              <div className="text-xs font-medium text-muted">Notes</div>
              <div className="mt-2 text-sm text-ink">{order.notes}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
