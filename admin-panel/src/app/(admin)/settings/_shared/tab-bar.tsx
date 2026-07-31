"use client";

import { cn } from "@/lib/utils";

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "relative -mb-px rounded-t-md px-3.5 py-2 text-sm font-medium transition-colors",
            active === t.id ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
          {active === t.id ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" /> : null}
        </button>
      ))}
    </div>
  );
}
