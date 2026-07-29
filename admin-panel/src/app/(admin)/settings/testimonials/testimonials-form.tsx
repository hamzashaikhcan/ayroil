"use client";

import { ImageUploader } from "@/components/ui/image-uploader";
import { Card } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type TestimonialsSlice = Pick<SettingsLike, "testimonials">;

export function TestimonialsForm({ initial }: { initial: SettingsLike }) {
  const { s, setS, pending, saved, error, onSubmit } = useSettingsSave<TestimonialsSlice>({
    testimonials: initial.testimonials ?? [],
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card
        title="Testimonial screenshots"
        subtitle={`${s.testimonials.length} image${s.testimonials.length === 1 ? "" : "s"}. Shown on every product page, in this order.`}
      >
        <ImageUploader
          images={s.testimonials}
          onChange={(next) => setS((prev) => ({ ...prev, testimonials: next }))}
        />
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
