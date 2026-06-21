export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type RangePreset = "today" | "yesterday" | "week" | "month" | "year" | "ytd" | "mtd" | "all" | "custom";

export const RANGE_LABELS: { preset: RangePreset; label: string }[] = [
  { preset: "today", label: "Today" },
  { preset: "yesterday", label: "Yesterday" },
  { preset: "week", label: "Last 7d" },
  { preset: "month", label: "Last 30d" },
  { preset: "mtd", label: "MTD" },
  { preset: "ytd", label: "YTD" },
  { preset: "year", label: "Last 12m" },
  { preset: "all", label: "All time" },
];
