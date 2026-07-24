"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimeseriesPoint } from "@/lib/server-api";
import { formatDate } from "@/lib/utils";

export function OrdersLineChart({ series }: { series: TimeseriesPoint[] }) {
  const data = series.map((p) => ({
    date: formatDate(p.bucket, { month: "short", day: "numeric" }),
    orders: p.orders,
    revenue: Math.round(p.revenueCents / 100),
  }));

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg bg-surface-2 text-sm text-muted">
        No orders in this range yet.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c6cdf" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#2c6cdf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e4e6ea" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#616a73" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#616a73" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e4e6ea",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
              boxShadow: "0 6px 20px -6px rgba(16,24,40,0.12)",
            }}
            cursor={{ stroke: "#d3d7dd", strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="orders"
            stroke="#2c6cdf"
            strokeWidth={2}
            fill="url(#ordersFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
