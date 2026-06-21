import Link from "next/link";
import { fetchOrders } from "@/lib/server-api";
import { formatPrice } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";

export default async function OrdersPage() {
  const orders = await fetchOrders();
  return (
    <div className="space-y-5">
      <PageHeader title="Orders" subtitle={`${orders.length} total orders`} />

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Order</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-muted">No orders yet.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-b-0 row-hover">
                  <td className="px-5 py-3">
                    <Link href={`/orders/${o.id}`} className="font-mono text-xs font-medium text-accent hover:text-accent-deep">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{o.customerName}</div>
                    <div className="text-xs text-muted">{o.email}</div>
                  </td>
                  <td className="px-5 py-3"><StatusPill value={o.status} /></td>
                  <td className="px-5 py-3 font-medium tabular-nums text-ink">{formatPrice(o.totalCents)}</td>
                  <td className="px-5 py-3 text-muted tabular-nums">{new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
