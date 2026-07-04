"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { generatePageCopy, type AiPageKind } from "@/lib/ai-pages";
import { AiWriteButton } from "./ai-write-button";
import { Card, Field } from "./fields";
import { StickySaveBar } from "./save-bar";
import { useSettingsSave } from "./use-settings-save";
import type { SettingsLike } from "./types";

const RichEditor = dynamic(
  () => import("@/components/ui/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full rounded-md border border-line bg-surface-2 p-3 text-sm text-muted">
        Loading editor…
      </div>
    ),
  },
);

/**
 * Reusable rich-text settings sub-page form. Used by Benefits, Terms, Privacy,
 * Shipping, and Returns — anywhere the admin edits one title + one HTML body.
 * Pass `aiPage` to offer a "Write with AI" draft generated from the live store
 * facts (shipping days, return window, contact email, products).
 */
export function RichTextPageForm<T extends keyof SettingsLike, B extends keyof SettingsLike>({
  initial,
  titleKey,
  bodyKey,
  titleLabel,
  bodyLabel,
  titleHint,
  bodyHint,
  placeholder,
  aiPage,
}: {
  initial: SettingsLike;
  titleKey: T;
  bodyKey: B;
  titleLabel: string;
  bodyLabel: string;
  titleHint?: string;
  bodyHint?: string;
  placeholder?: string;
  aiPage?: Exclude<AiPageKind, "faqs">;
}) {
  type Slice = Pick<SettingsLike, T | B>;
  const slice = {
    [titleKey]: initial[titleKey],
    [bodyKey]: initial[bodyKey],
  } as Slice;

  const { s, setS, patch, pending, saved, error, onSubmit } = useSettingsSave<Slice>(slice);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // RichEditor only reads its initial value once — remount it when AI applies.
  const [editorKey, setEditorKey] = useState(0);

  async function writeWithAi() {
    if (!aiPage) return;
    setAiPending(true);
    setAiError(null);
    try {
      const res = await generatePageCopy(aiPage);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setS((prev) => ({ ...prev, [titleKey]: res.data.title, [bodyKey]: res.data.body }));
      setEditorKey((k) => k + 1);
    } catch {
      setAiError("Generation failed. Please try again.");
    } finally {
      setAiPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title={titleLabel} subtitle={titleHint}>
        <Field
          label="Title"
          value={String(s[titleKey] ?? "")}
          onChange={(v) => patch(titleKey, v as Slice[T])}
        />
        <div className="mt-4">
          <label className="text-xs font-medium text-muted">{bodyLabel}</label>
          <div className="mt-1.5">
            {aiPending ? (
              <div className="flex h-40 w-full items-center justify-center rounded-md border border-line bg-surface-2 text-sm text-muted">
                Writing the page section by section from your store facts… this can take a minute or two.
              </div>
            ) : (
              <RichEditor
                key={editorKey}
                value={String(s[bodyKey] ?? "")}
                onChange={(html) => patch(bodyKey, html as Slice[B])}
                placeholder={placeholder}
              />
            )}
          </div>
          {aiError ? <p className="mt-1.5 text-xs text-bad">{aiError}</p> : null}
          {bodyHint ? (
            <p className="mt-1.5 text-xs text-muted">{bodyHint}</p>
          ) : null}
        </div>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
      {aiPage ? <AiWriteButton pending={aiPending} onClick={writeWithAi} /> : null}
    </form>
  );
}

