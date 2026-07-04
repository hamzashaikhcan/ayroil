"use client";

/**
 * Floating "Write with AI" action, pinned bottom-right above the sticky save
 * bar on every settings page that supports AI drafting. Always in view, so
 * the capability is impossible to miss.
 */
export function AiWriteButton({
  pending,
  onClick,
}: {
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="fixed bottom-20 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-6px_rgba(0,0,0,0.35),0_18px_40px_-12px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.03] hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
    >
      {pending ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconSparkles className="h-4 w-4" />}
      {pending ? "Writing…" : "Write with AI"}
    </button>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}
