import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { RangePicker } from "@/components/ui/range-picker";
import { OrdersLineChart } from "@/components/charts/orders-line-chart";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";
import { fetchOverview, fetchTimeseries, fetchTopProducts } from "@/lib/server-api";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { RangePreset } from "@/lib/api";
import { IconChevronRight } from "@/components/ui/icons";

export default async function OverviewPage(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const preset = (sp.preset as RangePreset | undefined) ?? "month";
  const from = sp.from as string | undefined;
  const to = sp.to as string | undefined;

  const [overview, timeseries, topProducts] = await Promise.all([
    fetchOverview(preset, from, to),
    fetchTimeseries(preset, from, to),
    fetchTopProducts(preset, from, to),
  ]);

  if (!overview) {
    return (
      <div className="card p-10 text-center">
        <div className="text-sm font-medium text-ink">Cannot reach the backend</div>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Make sure <span className="font-mono text-ink">express-backend</span> is running on port 4000, and your admin session is signed in.
        </p>
      </div>
    );
  }

  const k = overview.kpis;
  const rangeFrom = new Date(overview.range.from).toLocaleDateString();
  const rangeTo = new Date(overview.range.to).toLocaleDateString();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Showing ${rangeFrom} → ${rangeTo}`}
        actions={<RangePicker />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Revenue" value={formatPrice(k.revenueCents)} sub={`${formatNumber(k.totalOrders)} orders`} />
        <KpiCard label="Profit" value={formatPrice(k.profitCents)} sub={`AOV ${formatPrice(k.aovCents)}`} />
        <KpiCard label="Units sold" value={formatNumber(k.unitsSold)} sub={`${formatNumber(k.totalProducts)} products live`} />
        <KpiCard label="New customers" value={formatNumber(k.newUsers)} sub={`${formatNumber(k.totalUsers)} total`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="card">
          <div className="flex items-start justify-between border-b border-line p-5">
            <div>
              <div className="text-xs font-medium text-muted">Orders</div>
              <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink">
                {formatNumber(k.totalOrders)}
                <span className="ml-2 text-xs font-normal text-muted">by {overview.bucket}</span>
              </div>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-deep"
            >
              View all
              <IconChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-3">
            <OrdersLineChart series={timeseries?.series ?? []} />
          </div>
        </div>

        <div className="card">
          <div className="border-b border-line p-5">
            <div className="text-xs font-medium text-muted">Top products</div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink">By units sold</div>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">No sales in this range.</div>
          ) : (
            <ul>
              {topProducts.slice(0, 6).map((p, i) => (
                <li key={p.productName} className="flex items-center justify-between border-b border-line px-5 py-3 text-sm last:border-b-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-md bg-surface-2 text-xs font-semibold text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-ink">{p.productName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-ink tabular-nums">{p.units} u</div>
                    <div className="text-xs text-muted tabular-nums">{formatPrice(p.revenueCents)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card table-card-shell">
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <div className="text-xs font-medium text-muted">Recent activity</div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink">Latest orders</div>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-deep"
          >
            View all
            <IconChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
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
              {overview.recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted">No orders yet.</td></tr>
              ) : overview.recentOrders.map((o) => (
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
                  <td className="px-5 py-3 text-muted tabular-nums" data-label="Date">{new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
