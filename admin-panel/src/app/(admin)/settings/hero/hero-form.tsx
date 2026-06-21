"use client";

import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { Card, Field, TextField } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type HeroSlice = Pick<
  SettingsLike,
  | "heroEyebrow"
  | "heroTitle"
  | "heroSubtitle"
  | "heroDescription"
  | "heroImageUrl"
  | "heroPrimaryCtaLabel"
  | "heroPrimaryCtaHref"
  | "heroSecondaryCtaLabel"
  | "heroSecondaryCtaHref"
>;

export function HeroForm({ initial }: { initial: SettingsLike }) {
  const slice: HeroSlice = {
    heroEyebrow: initial.heroEyebrow ?? "",
    heroTitle: initial.heroTitle ?? "",
    heroSubtitle: initial.heroSubtitle ?? "",
    heroDescription: initial.heroDescription ?? "",
    heroImageUrl: initial.heroImageUrl ?? "",
    heroPrimaryCtaLabel: initial.heroPrimaryCtaLabel ?? "",
    heroPrimaryCtaHref: initial.heroPrimaryCtaHref ?? "",
    heroSecondaryCtaLabel: initial.heroSecondaryCtaLabel ?? "",
    heroSecondaryCtaHref: initial.heroSecondaryCtaHref ?? "",
  };

  const { s, patch, pending, saved, error, onSubmit } = useSettingsSave<HeroSlice>(slice);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card
        title="Copy"
        subtitle="Leave any field empty to fall back to the site's default (site name, slogan, short description)."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Eyebrow"
            value={s.heroEyebrow}
            onChange={(v) => patch("heroEyebrow", v)}
            placeholder="A single-product brand · Est. 2024"
            className="md:col-span-2"
          />
          <Field
            label="Title"
            value={s.heroTitle}
            onChange={(v) => patch("heroTitle", v)}
            placeholder="Your store name or hero headline"
          />
          <Field
            label="Subtitle"
            value={s.heroSubtitle}
            onChange={(v) => patch("heroSubtitle", v)}
            placeholder="One short line under the headline"
          />
          <TextField
            label="Description"
            value={s.heroDescription}
            onChange={(v) => patch("heroDescription", v)}
            className="md:col-span-2"
            rows={3}
          />
        </div>
      </Card>

      <Card title="Image" subtitle="Square image works best. Leave empty to show the primary product image.">
        <div className="max-w-xs">
          <SingleImageUpload
            label="Hero image"
            value={s.heroImageUrl}
            onChange={(v) => patch("heroImageUrl", v)}
            hint="Recommended ~1200×1200"
          />
        </div>
      </Card>

      <Card title="Buttons" subtitle="Leave both labels empty to show the default Add-to-cart + Read-the-spec buttons.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Primary button label"
            value={s.heroPrimaryCtaLabel}
            onChange={(v) => patch("heroPrimaryCtaLabel", v)}
            placeholder="Shop now"
          />
          <Field
            label="Primary button link"
            value={s.heroPrimaryCtaHref}
            onChange={(v) => patch("heroPrimaryCtaHref", v)}
            placeholder="/shop"
          />
          <Field
            label="Secondary button label"
            value={s.heroSecondaryCtaLabel}
            onChange={(v) => patch("heroSecondaryCtaLabel", v)}
            placeholder="Learn more"
          />
          <Field
            label="Secondary button link"
            value={s.heroSecondaryCtaHref}
            onChange={(v) => patch("heroSecondaryCtaHref", v)}
            placeholder="/benefits"
          />
        </div>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
