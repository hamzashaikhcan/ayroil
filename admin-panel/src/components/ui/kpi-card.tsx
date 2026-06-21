import { IconArrowUp, IconArrowDown } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: string; positive: boolean };
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-muted">{label}</div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              delta.positive ? "bg-good-soft text-good" : "bg-bad-soft text-bad",
            )}
          >
            {delta.positive ? <IconArrowUp className="h-2.5 w-2.5" /> : <IconArrowDown className="h-2.5 w-2.5" />}
            {delta.value}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
