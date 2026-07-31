"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IconDots } from "./icons";

export type RowMenuItem =
  | { type: "separator" }
  | { label: string; onClick: () => void; disabled?: boolean; destructive?: boolean; title?: string };

/**
 * Per-row "⋯" actions menu for dense tables — used instead of a row of
 * inline text links, which wraps onto multiple lines and reads as clutter
 * once a row has more than two or three actions. Renders via a portal
 * positioned from the trigger button's rect so it isn't clipped by a
 * scrollable table container (`overflow-x-auto` implicitly clips the y axis
 * too), and closes on outside click, scroll, resize, or Escape.
 */
export function RowMenu({ items, disabled }: { items: RowMenuItem[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 4, left: rect.right });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onDismiss() {
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("resize", onDismiss);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("resize", onDismiss);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-ink/[0.05] hover:text-ink disabled:opacity-40"
      >
        <IconDots className="h-4 w-4" />
      </button>
      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translateX(-100%)" }}
              className="z-[100] min-w-[11rem] overflow-hidden rounded-md border border-line bg-surface py-1 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25)]"
            >
              {items.map((item, i) =>
                "type" in item ? (
                  <div key={i} className="my-1 h-px bg-line" />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    title={item.title}
                    onClick={() => {
                      setOpen(false);
                      item.onClick();
                    }}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-ink/[0.04] disabled:opacity-40 disabled:hover:bg-transparent",
                      item.destructive ? "text-bad" : "text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
