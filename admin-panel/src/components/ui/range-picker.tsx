"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RANGE_LABELS, type RangePreset } from "@/lib/api";
import { IconCalendar, IconChevronDown } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function RangePicker() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = (sp.get("preset") ?? "month") as RangePreset;
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(current === "custom");
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  const currentLabel =
    current === "custom"
      ? "Custom range"
      : (RANGE_LABELS.find((r) => r.preset === current)?.label ?? "Last 30d");

  function setPreset(preset: RangePreset) {
    const params = new URLSearchParams(sp.toString());
    params.set("preset", preset);
    if (preset !== "custom") {
      params.delete("from");
      params.delete("to");
      setCustomOpen(false);
    } else {
      setCustomOpen(true);
    }
    router.replace(`?${params.toString()}`);
    setOpen(false);
  }

  function setCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams(sp.toString());
    params.set("preset", "custom");
    params.set("from", String(fd.get("from") ?? ""));
    params.set("to", String(fd.get("to") ?? ""));
    router.replace(`?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:border-line-strong"
      >
        <IconCalendar className="h-3.5 w-3.5 text-muted" />
        {currentLabel}
        <IconChevronDown className="h-3 w-3 text-muted" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-line bg-surface p-2 shadow-[0_12px_40px_-12px_rgba(16,24,40,0.18)]">
            <div className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft">
              Presets
            </div>
            <div className="grid grid-cols-2 gap-1">
              {RANGE_LABELS.map((r) => (
                <button
                  key={r.preset}
                  onClick={() => setPreset(r.preset)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-left text-xs",
                    current === r.preset
                      ? "bg-accent-soft font-medium text-accent-deep"
                      : "text-ink hover:bg-ink/[0.04]",
                  )}
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setPreset("custom")}
                className={cn(
                  "col-span-2 rounded-md px-2.5 py-1.5 text-left text-xs",
                  current === "custom"
                    ? "bg-accent-soft font-medium text-accent-deep"
                    : "text-ink hover:bg-ink/[0.04]",
                )}
              >
                Custom range…
              </button>
            </div>

            {customOpen ? (
              <form onSubmit={setCustom} className="mt-2 border-t border-line pt-2">
                <div className="grid grid-cols-2 gap-2 px-1">
                  <label className="block">
                    <span className="block text-xs font-medium uppercase tracking-wider text-muted">From</span>
                    <input
                      name="from"
                      type="date"
                      defaultValue={from}
                      required
                      className="mt-1 h-8 w-full rounded-md border border-line bg-surface-2 px-2 text-xs"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium uppercase tracking-wider text-muted">To</span>
                    <input
                      name="to"
                      type="date"
                      defaultValue={to}
                      required
                      className="mt-1 h-8 w-full rounded-md border border-line bg-surface-2 px-2 text-xs"
                    />
                  </label>
                </div>
                <div className="mt-2 px-1">
                  <button type="submit" className="h-8 w-full rounded-md bg-ink text-xs font-medium text-background hover:bg-ink-soft">
                    Apply
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
