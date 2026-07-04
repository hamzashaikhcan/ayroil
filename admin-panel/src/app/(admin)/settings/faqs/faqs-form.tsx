"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { generatePageCopy } from "@/lib/ai-pages";
import { AiWriteButton } from "../_shared/ai-write-button";
import { Card } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type FaqsSlice = Pick<SettingsLike, "faqs">;

export function FaqsForm({ initial }: { initial: SettingsLike }) {
  const confirm = useConfirm();
  const { s, setS, pending, saved, error, onSubmit } = useSettingsSave<FaqsSlice>({
    faqs: initial.faqs ?? [],
  });
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function writeWithAi() {
    if (s.faqs.length > 0) {
      const ok = await confirm({
        title: "Replace the current FAQs?",
        description:
          "The AI will write a fresh set of 10-12 FAQs from your live store facts (shipping, returns, product). The FAQs currently in this list will be replaced. Nothing is saved until you press Save.",
        targetName: `${s.faqs.length} existing FAQ${s.faqs.length === 1 ? "" : "s"}`,
        confirmLabel: "Replace FAQs",
      });
      if (!ok) return;
    }
    setAiPending(true);
    setAiError(null);
    try {
      const res = await generatePageCopy("faqs");
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setS((prev) => ({ ...prev, faqs: res.data.faqs }));
    } catch {
      setAiError("Generation failed. Please try again.");
    } finally {
      setAiPending(false);
    }
  }

  function addFaq() {
    setS((prev) => ({ ...prev, faqs: [...prev.faqs, { q: "", a: "" }] }));
  }
  function updateFaq(i: number, k: "q" | "a", v: string) {
    setS((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)),
    }));
  }
  function removeFaq(i: number) {
    setS((prev) => ({ ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) }));
  }
  function moveFaq(i: number, dir: -1 | 1) {
    const j = i + dir;
    setS((prev) => {
      if (j < 0 || j >= prev.faqs.length) return prev;
      const next = prev.faqs.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return { ...prev, faqs: next };
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="FAQs" subtitle={`${s.faqs.length} entr${s.faqs.length === 1 ? "y" : "ies"}.`}>
        {s.faqs.length === 0 ? (
          <div className="rounded-md border border-dashed border-line-strong bg-surface-2 p-8 text-center">
            <div className="text-sm font-medium text-ink">No FAQs yet</div>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
              Add the questions your customers ask most. They&apos;ll appear on the homepage FAQ section and the dedicated /faq page.
            </p>
            <Button type="button" onClick={addFaq} variant="primary" size="sm" className="mt-4">
              Add first FAQ
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {s.faqs.map((f, i) => (
              <li key={i} className="rounded-md border border-line bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                    Q{i + 1} · {f.q ? `${f.q.slice(0, 60)}${f.q.length > 60 ? "…" : ""}` : "Untitled"}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconButton onClick={() => moveFaq(i, -1)} disabled={i === 0} label="Move up">
                      ↑
                    </IconButton>
                    <IconButton onClick={() => moveFaq(i, 1)} disabled={i === s.faqs.length - 1} label="Move down">
                      ↓
                    </IconButton>
                    <IconButton onClick={() => removeFaq(i)} label="Remove" variant="danger">
                      ✕
                    </IconButton>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted">Question</label>
                    <input
                      value={f.q}
                      onChange={(e) => updateFaq(i, "q", e.target.value)}
                      placeholder="How long does shipping take?"
                      className="mt-1.5 h-9 w-full rounded-md border border-line bg-background px-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Answer</label>
                    <textarea
                      value={f.a}
                      onChange={(e) => updateFaq(i, "a", e.target.value)}
                      rows={2}
                      placeholder="3–5 business days for standard shipping."
                      className="mt-1.5 w-full rounded-md border border-line bg-background px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:bg-surface focus:outline-none"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {s.faqs.length > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <span className="text-xs text-muted">
              {s.faqs.length} FAQ{s.faqs.length === 1 ? "" : "s"}
            </span>
            <Button type="button" onClick={addFaq} variant="secondary" size="sm">
              + Add FAQ
            </Button>
          </div>
        ) : null}
        {aiError ? <p className="mt-2 text-xs text-bad">{aiError}</p> : null}
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
      <AiWriteButton pending={aiPending} onClick={writeWithAi} />
    </form>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  label,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-xs font-medium transition-colors disabled:opacity-30 ${
        variant === "danger" ? "text-bad hover:bg-bad-soft" : "text-ink hover:bg-background"
      }`}
    >
      {children}
    </button>
  );
}
