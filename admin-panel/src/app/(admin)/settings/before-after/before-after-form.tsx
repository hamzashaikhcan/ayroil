"use client";

import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { Card } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type BeforeAfterSlice = Pick<SettingsLike, "beforeAfterBeforeImageUrl" | "beforeAfterAfterImageUrl">;

export function BeforeAfterForm({ initial }: { initial: SettingsLike }) {
  const { s, patch, pending, saved, error, onSubmit } = useSettingsSave<BeforeAfterSlice>({
    beforeAfterBeforeImageUrl: initial.beforeAfterBeforeImageUrl ?? "",
    beforeAfterAfterImageUrl: initial.beforeAfterAfterImageUrl ?? "",
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="Comparison images" subtitle="Use the same crop/angle for both so the slider lines up cleanly.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SingleImageUpload
            label="Before image"
            value={s.beforeAfterBeforeImageUrl}
            onChange={(v) => patch("beforeAfterBeforeImageUrl", v)}
            aspect="tall"
            hint="Recommended ~1000×1300, portrait"
          />
          <SingleImageUpload
            label="After image"
            value={s.beforeAfterAfterImageUrl}
            onChange={(v) => patch("beforeAfterAfterImageUrl", v)}
            aspect="tall"
            hint="Same crop and angle as the before image"
          />
        </div>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
