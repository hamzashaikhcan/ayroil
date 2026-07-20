"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * A searchable dropdown that also accepts free text — for fields like city
 * or region where the option list is a helpful shortlist, not an exhaustive
 * source of truth. Typing anything and blurring keeps it as-is even if it
 * doesn't match a suggestion.
 */
export function Combobox({
  id,
  name,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  required,
  autoComplete,
  invalid,
  ariaDescribedBy,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  invalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const matches = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return matches.slice(0, 40);
  }, [options, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
        required={required}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Let a click on an option register before we close + fire onBlur.
          window.setTimeout(() => setOpen(false), 100);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (!open || filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            pick(filtered[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`h-11 w-full rounded-md border bg-background px-3.5 text-sm text-ink placeholder:text-muted focus:outline-none ${
          invalid ? "border-red-400 focus:border-red-500" : "border-line-strong focus:border-ink"
        }`}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-md border border-line-strong bg-surface py-1 shadow-lg"
        >
          {filtered.map((option, i) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              // onMouseDown (not onClick) fires before the input's onBlur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              className={`cursor-pointer px-3.5 py-2 text-sm ${
                i === highlight ? "bg-ink/5 text-ink" : "text-ink"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
