export type RangePreset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "year"
  | "ytd"
  | "mtd"
  | "all"
  | "custom";

export type DateRange = { from: Date; to: Date };

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}

export function resolveRange(
  preset: RangePreset | undefined,
  fromIso: string | undefined,
  toIso: string | undefined,
): DateRange {
  const now = new Date();
  if (preset === "custom" && fromIso && toIso) {
    return { from: startOfDay(new Date(fromIso)), to: endOfDay(new Date(toIso)) };
  }
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "week": {
      const f = new Date(now);
      f.setDate(f.getDate() - 6);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "month": {
      const f = new Date(now);
      f.setDate(f.getDate() - 29);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "mtd": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "year": {
      const f = new Date(now);
      f.setFullYear(f.getFullYear() - 1);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "ytd": {
      const f = new Date(now.getFullYear(), 0, 1);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case "all":
    default:
      return { from: new Date(2000, 0, 1), to: endOfDay(now) };
  }
}

export function bucketSize(range: DateRange): "day" | "week" | "month" {
  const days = Math.ceil(
    (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}
