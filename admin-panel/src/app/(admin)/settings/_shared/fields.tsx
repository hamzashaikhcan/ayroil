"use client";

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="border-b border-line p-4 md:p-5">
        <div className="text-sm font-semibold text-ink">{title}</div>
        {subtitle ? <div className="mt-0.5 text-xs text-muted">{subtitle}</div> : null}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  required,
  className,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  className,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  rows?: number;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink focus:border-ink/30 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-line bg-surface-2 p-1 focus-within:border-ink/30 focus-within:bg-surface">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-line bg-transparent"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-full bg-transparent px-1 font-mono text-xs uppercase text-ink focus:outline-none"
        />
      </div>
    </div>
  );
}
