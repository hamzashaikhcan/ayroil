"use client";

import { useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";

/**
 * Site-wide before/after comparison slider (one shared pair, admin-managed
 * via Settings → Before / after), shown identically on every product detail
 * page. The drag handle is a native <input type="range"> stretched over the
 * image and made invisible — gives free keyboard + screen-reader support
 * instead of hand-rolled pointer-event dragging.
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: {
  beforeUrl: string;
  afterUrl: string;
}) {
  const [percent, setPercent] = useState(50);

  if (!beforeUrl || !afterUrl) return null;

  return (
    <section className="border-t border-line py-16">
      <Container>
        <div className="max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Real results</span>
          </div>
          <h2 className="font-display mt-4 text-2xl tracking-tight text-ink">
            See the before and after
          </h2>
        </div>

        <div className="relative mx-auto mt-8 aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-line bg-background select-none sm:aspect-[3/4]">
          <Image
            src={afterUrl}
            alt="After using the product"
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
            <Image
              src={beforeUrl}
              alt="Before using the product"
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
            />
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-background/90"
            style={{ left: `${percent}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-ink shadow-md"
            style={{ left: `${percent}%` }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
            </svg>
          </div>

          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-background">
            Before
          </span>
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-background">
            After
          </span>

          <input
            type="range"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            aria-label="Drag to compare before and after"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </Container>
    </section>
  );
}
