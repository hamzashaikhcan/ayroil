import Link from "next/link";
import { fetchOrders } from "@/lib/server-api";
import { formatDate, formatPrice } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";

export default async function OrdersPage() {
  const orders = await fetchOrders();
  return (
    <div className="space-y-5">
      <PageHeader title="Orders" subtitle={`${orders.length} total orders`} />

      <div className="card table-card-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Order</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Shipping cost</th>
                <th className="px-5 py-2.5 font-medium">Profit</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted">No orders yet.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-b-0 row-hover">
                  <td className="px-5 py-3" data-label="Order">
                    <Link href={`/orders/${o.id}`} className="font-mono text-xs font-medium text-accent hover:text-accent-deep">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3" data-label="Customer">
                    <div className="font-medium text-ink">{o.customerName}</div>
                    <div className="text-xs text-muted">{o.email}</div>
                  </td>
                  <td className="px-5 py-3" data-label="Status"><StatusPill value={o.status} /></td>
                  <td className="px-5 py-3 font-medium tabular-nums text-ink" data-label="Total">{formatPrice(o.totalCents)}</td>
                  <td className="px-5 py-3 tabular-nums" data-label="Shipping cost">
                    {o.actualShippingCostCents != null
                      ? <span className="font-medium text-ink">{formatPrice(o.actualShippingCostCents)}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td
                    className={`px-5 py-3 font-medium tabular-nums ${o.profitCents < 0 ? "text-bad" : "text-ink"}`}
                    data-label="Profit"
                  >
                    {formatPrice(o.profitCents)}
                  </td>
                  <td className="px-5 py-3 text-muted tabular-nums" data-label="Date">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
