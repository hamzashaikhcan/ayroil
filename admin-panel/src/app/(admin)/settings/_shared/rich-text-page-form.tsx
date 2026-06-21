"use client";

import dynamic from "next/dynamic";
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
 * Reusable rich-text settings sub-page form. Used by Benefits, Terms, and
 * Privacy — anywhere the admin edits one title + one HTML body.
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
}: {
  initial: SettingsLike;
  titleKey: T;
  bodyKey: B;
  titleLabel: string;
  bodyLabel: string;
  titleHint?: string;
  bodyHint?: string;
  placeholder?: string;
}) {
  type Slice = Pick<SettingsLike, T | B>;
  const slice = {
    [titleKey]: initial[titleKey],
    [bodyKey]: initial[bodyKey],
  } as Slice;

  const { s, patch, pending, saved, error, onSubmit } = useSettingsSave<Slice>(slice);

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
            <RichEditor
              value={String(s[bodyKey] ?? "")}
              onChange={(html) => patch(bodyKey, html as Slice[B])}
              placeholder={placeholder}
            />
          </div>
          {bodyHint ? (
            <p className="mt-1.5 text-xs text-muted">{bodyHint}</p>
          ) : null}
        </div>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
