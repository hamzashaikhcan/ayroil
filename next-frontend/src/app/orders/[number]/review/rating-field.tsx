"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

export function RatingField() {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? rating;

  return (
    <fieldset>
      <legend className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Rating</legend>
      <input type="hidden" name="rating" value={rating} />
      <div
        className="mt-3 inline-flex rounded-full border border-line bg-surface px-3 py-2 shadow-sm"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value === 1 ? "" : "s"} - ${RATING_LABELS[value]}`}
            aria-pressed={rating === value}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            className="group grid h-11 w-11 place-items-center rounded-full transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <StarIcon
              className={cn(
                "h-8 w-8 transition duration-150",
                value <= active ? "scale-105 text-amber-500" : "text-line-strong",
              )}
              filled={value <= active}
            />
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-ink">{RATING_LABELS[rating]}</p>
    </fieldset>
  );
}

function StarIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m10 2.5 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L2.5 8l5.2-.8L10 2.5Z" />
    </svg>
  );
}
