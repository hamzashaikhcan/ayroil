"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { generateProductCopy } from "@/lib/ai";
import type { GeneratedProduct } from "@/lib/ai-types";

const LOADING_STEPS = [
  "Analysing your photos...",
  "Reading the current product copy...",
  "Researching buyer keywords...",
  "Writing PDP-ready content...",
  "Polishing the final draft...",
];

/**
 * Floating AI Product Writer for Ayroil's product form. It keeps the Sambeel
 * widget shell, but only reads and writes fields this product form actually has.
 */
export function AiProductWidget({
  name,
  tagline,
  shortDescription,
  highlights,
  images,
  logoUrl,
  onApply,
}: {
  name: string;
  tagline: string | null;
  shortDescription: string;
  highlights: string[];
  images: string[];
  logoUrl?: string;
  onApply: (data: GeneratedProduct) => void;
}) {
  const [open, setOpen] = useState(false);
  const [render, setRender] = useState(false);
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedProduct | null>(null);
  const [applied, setApplied] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const frameOne = useRef<number | null>(null);
  const frameTwo = useRef<number | null>(null);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      if (frameOne.current) window.cancelAnimationFrame(frameOne.current);
      if (frameTwo.current) window.cancelAnimationFrame(frameTwo.current);
    };
  }, []);

  const canGenerate = name.trim().length > 0 && !loading;

  function openPanel() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
    setRender(true);
    frameOne.current = window.requestAnimationFrame(() => {
      frameTwo.current = window.requestAnimationFrame(() => setShown(true));
    });
  }

  function closePanel() {
    setOpen(false);
    setShown(false);
    closeTimer.current = window.setTimeout(() => setRender(false), 220);
  }

  function togglePanel() {
    if (open) closePanel();
    else openPanel();
  }

  async function generate() {
    setStep(0);
    setLoading(true);
    setError("");
    setResult(null);
    setApplied(false);

    const res = await generateProductCopy({
      name,
      tagline,
      shortDescription,
      highlights,
      images,
    });

    setLoading(false);
    if (res.ok) setResult(res.data);
    else setError(res.error);
  }

  function apply() {
    if (!result) return;
    onApply(result);
    setApplied(true);
    setTimeout(() => {
      closePanel();
      setApplied(false);
    }, 1100);
  }

  return (
    // Single fixed anchor for the whole widget — the button and panel are both
    // normal-flow children stacked with flexbox, so the button can never drift
    // relative to the panel (no second independent "fixed" + magic-number gap
    // to keep in sync).
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3 sm:right-5">
      {render ? (
        <div
          className={`flex max-h-[70vh] w-[min(380px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl bg-[#1c1630] shadow-[0_10px_24px_-8px_rgba(20,14,40,0.5),0_30px_64px_-18px_rgba(20,14,40,0.65)] transition-all duration-200 ease-out ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#322b4e] px-4 py-3.5">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <LogoMark logoUrl={logoUrl} size={36} />
              <div>
                <p className="text-[13px] font-bold leading-none text-white">AI Product Writer</p>
                <p className="mt-1 text-[11px] text-white/55">SEO-ready copy from your photos</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-md p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!loading && !result ? (
              <div className="flex flex-col gap-3">
                <p className="text-[12.5px] leading-relaxed text-white/75">
                  I&apos;ll analyse the product&apos;s photos and current copy, then write the tagline, short
                  description, rich PDP description, highlights, FAQs and search keywords. Pricing, SKU and
                  stock are never changed.
                </p>

                <div className="flex flex-col gap-1.5 rounded-xl bg-white/[0.06] p-3 text-[12px]">
                  <Row label="Product name" value={name.trim() || "-"} ok={Boolean(name.trim())} />
                  <Row
                    label="Photos"
                    value={images.length ? `${images.length} uploaded` : "none yet"}
                    ok={images.length > 0}
                    icon
                  />
                  <Row
                    label="Existing copy"
                    value={tagline || shortDescription || highlights.length ? "used as context" : "none yet"}
                    ok={Boolean(tagline || shortDescription || highlights.length)}
                  />
                </div>

                {!name.trim() ? (
                  <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-2 text-[11.5px] text-amber-300">
                    Add a product name first. Photos are optional, but they make the draft much better.
                  </p>
                ) : null}

                {error ? <ErrorNote message={error} /> : null}

                <button
                  type="button"
                  onClick={generate}
                  disabled={!canGenerate}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] py-2.5 text-[13px] font-bold text-white transition-all hover:brightness-[1.04] disabled:opacity-50"
                >
                  <IconSparkles className="h-4 w-4" /> Generate content
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <IconLoader className="h-7 w-7 animate-spin text-[var(--accent)]" />
                <p className="text-[13px] font-semibold text-white">{LOADING_STEPS[step]}</p>
                <p className="text-[11.5px] text-white/55">This usually takes 10-30 seconds.</p>
              </div>
            ) : null}

            {!loading && result ? (
              <div className="flex flex-col gap-3">
                {error ? <ErrorNote message={error} /> : null}

                {result.keywords.length > 0 ? (
                  <Field label={`Target keywords (${result.keywords.length})`}>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords.map((keyword) => (
                        <Chip key={keyword} subtle>
                          {keyword}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                ) : null}

                {result.tagline ? (
                  <Field label="Tagline">
                    <Preview>{result.tagline}</Preview>
                  </Field>
                ) : null}

                {result.metaTitle ? (
                  <Field label="Meta title">
                    <Preview>{result.metaTitle}</Preview>
                  </Field>
                ) : null}

                {result.shortDescription ? (
                  <Field label="Meta description">
                    <Preview>{result.shortDescription}</Preview>
                  </Field>
                ) : null}

                {result.highlights.length > 0 ? (
                  <Field label={`Highlights (${result.highlights.length})`}>
                    <Preview>{result.highlights.join(" · ")}</Preview>
                  </Field>
                ) : null}

                {result.longDescription ? (
                  <Field label="Long description (rich)">
                    <Preview>
                      {result.longDescription
                        .replace(/<[^>]*>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 240)}
                      ...
                    </Preview>
                  </Field>
                ) : null}

                {result.faqs.length > 0 ? (
                  <Field label={`FAQs (${result.faqs.length})`}>
                    <Preview>{result.faqs.map((faq) => faq.q).join(" · ")}</Preview>
                  </Field>
                ) : null}

                <div className="sticky bottom-0 flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={apply}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.01]"
                    style={{ background: applied ? "#16a34a" : "var(--accent)" }}
                  >
                    {applied ? (
                      <>
                        <IconCheck className="h-4 w-4" /> Applied
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-4 w-4" /> Apply to form
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={generate}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-[12.5px] font-semibold text-white/75 transition-colors hover:bg-white/10"
                    title="Regenerate"
                  >
                    <IconRefresh className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="-mt-1 text-center text-[11px] text-white/45">
                  Review everything before saving. Pricing, SKU and inventory are never changed.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={togglePanel}
        className={`flex h-14 items-center overflow-hidden rounded-full bg-[#1c1630] transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
          open ? "w-[150px] justify-start gap-2 pl-3.5 pr-4" : "w-14 justify-center"
        }`}
        style={{
          boxShadow: "0 8px 18px -6px rgba(20,14,40,0.55), 0 20px 44px -12px rgba(20,14,40,0.65)",
        }}
        aria-label="AI Product Writer"
      >
        <LogoMark logoUrl={logoUrl} size={40} />
        <span
          className={`overflow-hidden whitespace-nowrap text-[13px] font-bold text-white transition-all duration-300 ease-out ${
            open ? "max-w-[80px] opacity-100 delay-75" : "max-w-0 opacity-0"
          }`}
        >
          AI Writer
        </span>
      </button>
    </div>
  );
}

function LogoMark({ logoUrl, size }: { logoUrl?: string; size: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
    >
      {logoUrl && !failed ? (
        <Image
          src={logoUrl}
          alt="AI Writer"
          width={size}
          height={size}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-black tracking-[-0.02em] text-[#1c1630]">AI</span>
      )}
    </span>
  );
}

function Row({ label, value, ok, icon }: { label: string; value: string; ok: boolean; icon?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-white/55">
        {icon ? <IconImage className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className={`max-w-[60%] truncate text-right font-medium ${ok ? "text-white" : "text-white/45"}`}>
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">{label}</span>
      {children}
    </div>
  );
}

function Preview({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-white/[0.06] px-2.5 py-2 text-[12.5px] leading-relaxed text-white/85">{children}</p>;
}

function Chip({ children, subtle }: { children: ReactNode; subtle?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        subtle ? "bg-white/10 text-white/70" : "bg-[var(--accent)]/15 text-[var(--accent)]"
      }`}
    >
      {children}
    </span>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-2 text-[11.5px] text-red-300">
      <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      <path d="M5 14l.7 1.8L7.5 16.5l-1.8.7L5 19l-.7-1.8L2.5 16.5l1.8-.7L5 14z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconLoader({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 15 4.5-4.5 4 4L14 12l7 7" />
      <circle cx="16.5" cy="9.5" r="1.5" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}
