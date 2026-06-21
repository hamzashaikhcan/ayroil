"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ProductArt } from "./product-art";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  slug,
  name,
}: {
  images: string[];
  slug: string;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <>
        <ProductArt seed={slug} label={name} className="aspect-square" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {["a", "b", "c"].map((s) => (
            <ProductArt key={s} seed={`${slug}-${s}`} label={name} className="aspect-square" />
          ))}
        </div>
      </>
    );
  }

  const main = images[active] ?? images[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxIndex(active)}
        aria-label="Open image in full view"
        className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <Image
          src={main}
          alt={`${name} — image ${active + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          priority
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-medium text-background opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIcon />
          Zoom
        </span>
      </button>

      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              onDoubleClick={() => setLightboxIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={active === i}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border transition-all",
                active === i
                  ? "border-ink ring-2 ring-ink/15"
                  : "border-line hover:border-line-strong",
              )}
            >
              <Image
                src={url}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                sizes="160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          name={name}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type Pan = { x: number; y: number };

function Lightbox({
  images,
  startIndex,
  name,
  onClose,
}: {
  images: string[];
  startIndex: number;
  name: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const total = images.length;

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [total]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [total]);

  const setZoomClamped = useCallback((next: number) => {
    setZoom(() => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      if (clamped === 1) setPan({ x: 0, y: 0 });
      return clamped;
    });
  }, []);

  // Keyboard nav + lock scroll
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "+" || e.key === "=") setZoomClamped(zoom + ZOOM_STEP);
      else if (e.key === "-" || e.key === "_") setZoomClamped(zoom - ZOOM_STEP);
      else if (e.key === "0") setZoomClamped(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, next, prev, setZoomClamped, zoom]);

  // Wheel-zoom inside the viewport, plus pinch-zoom via ctrlKey wheel events
  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
    const delta = -e.deltaY * 0.005;
    setZoomClamped(zoom + delta);
  }

  function onDoubleClick() {
    setZoomClamped(zoom > 1 ? 1 : 2);
  }

  // Drag-to-pan when zoomed in
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.x),
      y: dragRef.current.panY + (e.clientY - dragRef.current.y),
    });
  }

  function onPointerEnd() {
    dragRef.current = null;
    setDragging(false);
  }

  const zoomed = zoom > 1.001;

  // SSR guard for the portal — `document` isn't available during server
  // render. useSyncExternalStore returns false on SSR + first client render,
  // then true on the second client render once mounted, satisfying React 19's
  // strict effect rules without a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  // Portal escape: `position: sticky` on the gallery's parent column creates
  // a stacking context, which scopes the lightbox's z-index to that subtree.
  // Rendering to document.body lets the lightbox actually sit above the
  // sticky navbar.
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-ink/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex flex-none items-center justify-between gap-4 border-b border-background/10 px-4 py-3 text-background">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-background/60">
          {name} · {index + 1} / {total}
        </div>
        <div className="flex items-center gap-1.5">
          <ToolbarButton onClick={() => setZoomClamped(zoom - ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">−</ToolbarButton>
          <span className="min-w-11 text-center font-mono text-xs tabular-nums text-background/80">
            {Math.round(zoom * 100)}%
          </span>
          <ToolbarButton onClick={() => setZoomClamped(zoom + ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">+</ToolbarButton>
          <ToolbarButton onClick={() => setZoomClamped(1)} disabled={zoom === 1} aria-label="Reset zoom">⤾</ToolbarButton>
          <span className="mx-2 h-5 w-px bg-background/15" aria-hidden />
          <ToolbarButton onClick={onClose} aria-label="Close (Esc)">✕</ToolbarButton>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={(e) => {
          // Click outside the image (on the dark backdrop) closes.
          if (e.target === e.currentTarget) onClose();
        }}
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-hidden select-none",
          zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
        )}
      >
        {total > 1 ? (
          <>
            <NavArrow side="left" onClick={prev} />
            <NavArrow side="right" onClick={next} />
          </>
        ) : null}

        <div
          className="relative h-full w-full max-w-[min(96vw,1400px)]"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: dragging ? "none" : "transform 200ms ease-out",
            transformOrigin: "center",
          }}
        >
          <Image
            src={images[index]}
            alt={`${name} — image ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
            priority
            draggable={false}
          />
        </div>
      </div>

      {/* Thumb strip */}
      {total > 1 ? (
        <div className="flex flex-none items-center justify-center gap-2 border-t border-background/10 px-4 py-3">
          <div className="flex max-w-full gap-2 overflow-x-auto">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === index}
                className={cn(
                  "relative h-14 w-14 flex-none overflow-hidden rounded-md border transition-all",
                  i === index
                    ? "border-background ring-2 ring-background/40"
                    : "border-background/20 opacity-60 hover:opacity-100",
                )}
              >
                <Image src={url} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-background/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-background/70 backdrop-blur-sm">
        Scroll, double-click, or + / − to zoom · ← → to navigate · Esc to close
      </div>
    </div>,
    document.body,
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-background/15 bg-background/5 px-2 text-sm font-medium text-background transition-colors hover:bg-background/15 disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}

function NavArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-background/15 bg-background/5 text-background backdrop-blur-sm transition-colors hover:bg-background/20",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        {side === "left" ? (
          <path d="M10 3l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

function ZoomIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.7 7.7L10.5 10.5M3.5 5h3M5 3.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
