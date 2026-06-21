import { RangePicker } from "@/components/ui/range-picker";
import { OrdersLineChart } from "@/components/charts/orders-line-chart";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchOverview, fetchTimeseries, fetchTopProducts } from "@/lib/server-api";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { RangePreset } from "@/lib/api";

export default async function AnalyticsPage(props: PageProps<"/analytics">) {
  const sp = await props.searchParams;
  const preset = (sp.preset as RangePreset | undefined) ?? "month";
  const from = sp.from as string | undefined;
  const to = sp.to as string | undefined;

  const [overview, timeseries, top] = await Promise.all([
    fetchOverview(preset, from, to),
    fetchTimeseries(preset, from, to),
    fetchTopProducts(preset, from, to),
  ]);

  if (!overview) {
    return (
      <div className="card p-10 text-center">
        <div className="text-sm font-medium text-ink">Backend unreachable</div>
      </div>
    );
  }

  const k = overview.kpis;
  const rangeFrom = new Date(overview.range.from).toLocaleDateString();
  const rangeTo = new Date(overview.range.to).toLocaleDateString();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle={`${rangeFrom} → ${rangeTo}`}
        actions={<RangePicker />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Revenue" value={formatPrice(k.revenueCents)} />
        <KpiCard label="Profit" value={formatPrice(k.profitCents)} />
        <KpiCard label="Orders" value={formatNumber(k.totalOrders)} />
        <KpiCard label="AOV" value={formatPrice(k.aovCents)} />
        <KpiCard label="Units sold" value={formatNumber(k.unitsSold)} />
        <KpiCard label="New customers" value={formatNumber(k.newUsers)} />
        <KpiCard label="Total customers" value={formatNumber(k.totalUsers)} />
        <KpiCard label="Products" value={formatNumber(k.totalProducts)} />
      </div>

      <div className="card">
        <div className="border-b border-line p-5">
          <div className="text-xs font-medium text-muted">Orders over time</div>
          <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink">By {overview.bucket}</div>
        </div>
        <div className="p-3">
          <OrdersLineChart series={timeseries?.series ?? []} />
        </div>
      </div>

      <div className="card">
        <div className="border-b border-line p-5">
          <div className="text-xs font-medium text-muted">Top products</div>
          <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink">By revenue in range</div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">Product</th>
              <th className="px-5 py-2.5 font-medium">Units</th>
              <th className="px-5 py-2.5 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {top.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-12 text-center text-muted">No sales in this range.</td></tr>
            ) : top.map((p) => (
              <tr key={p.productName} className="border-b border-line last:border-b-0 row-hover">
                <td className="px-5 py-3 font-medium text-ink">{p.productName}</td>
                <td className="px-5 py-3 tabular-nums text-ink">{p.units}</td>
                <td className="px-5 py-3 font-medium tabular-nums text-ink">{formatPrice(p.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
