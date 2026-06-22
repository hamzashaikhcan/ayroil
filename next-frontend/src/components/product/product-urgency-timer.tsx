"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";

export function ProductUrgencyTimer({
  durationSeconds,
  discountPercent,
  message,
  priceCents,
  storageKey,
  onExpire,
  onDeadline,
}: {
  durationSeconds: number;
  discountPercent: number;
  message: string;
  priceCents: number;
  storageKey: string;
  onExpire?: () => void;
  onDeadline?: (deadline: number) => void;
}) {
  const duration = Math.max(1, Math.floor(durationSeconds));
  const discount = Math.max(1, Math.min(95, Math.floor(discountPercent)));
  const discountedPriceCents = Math.max(0, Math.round(priceCents * (100 - discount) / 100));
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const deadlineKey = `product-offer-deadline:${storageKey}`;
    const now = Date.now();
    const storedDeadline = Number(window.localStorage.getItem(deadlineKey) ?? 0);
    if (storedDeadline && storedDeadline <= now) {
      const expiredTick = window.setTimeout(() => {
        setRemaining(0);
        onExpire?.();
      }, 0);
      return () => window.clearTimeout(expiredTick);
    }

    const deadline = storedDeadline || now + duration * 1000;
    onDeadline?.(deadline);
    if (!storedDeadline) {
      window.localStorage.setItem(deadlineKey, String(deadline));
    }

    function tick() {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) onExpire?.();
    }

    const firstTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(() => {
      tick();
    }, 250);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [duration, storageKey, onExpire, onDeadline]);

  const progress = useMemo(() => (duration ? (remaining / duration) * 100 : 0), [duration, remaining]);
  const label = normalizeMessage(message);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink bg-ink text-background shadow-sm">
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-center font-display text-xl font-semibold leading-none text-accent-ink">
          {discount}%<br />
          <span className="text-xs">off</span>
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/60">
            Limited-time discount
          </div>
          <div className="mt-1 text-sm font-medium text-background">{label}</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-2xl leading-none text-accent">
              {formatPrice(discountedPriceCents)}
            </span>
            <span className="font-mono text-xs text-background/50 line-through">
              {formatPrice(priceCents)}
            </span>
          </div>
        </div>
        <div className="font-mono text-3xl font-semibold tabular-nums text-accent sm:text-right">
          {formatRemaining(remaining)}
        </div>
      </div>
      <div className="h-1.5 bg-background/10">
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function formatRemaining(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${pad(minutes)}:${pad(secs)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed === "Your cart price is reserved for" || trimmed === "Buy before the timer ends to claim this discount") {
    return "Offer ends in";
  }
  return trimmed;
}
