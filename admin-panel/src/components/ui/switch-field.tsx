"use client";

import { cn } from "@/lib/utils";

export function SwitchField({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 rounded-md border border-line bg-surface-2 p-3", className)}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative mt-0.5 inline-flex h-6 w-11 flex-none rounded-full border border-line-strong bg-surface transition-colors after:absolute after:left-0.5 after:top-px after:h-5 after:w-5 after:rounded-full after:bg-muted-soft after:shadow-sm after:transition-transform peer-checked:border-ink peer-checked:bg-ink peer-checked:after:translate-x-5 peer-checked:after:bg-white"
      />
    </label>
  );
}
