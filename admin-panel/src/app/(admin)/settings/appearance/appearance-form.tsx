"use client";

import { Card, ColorField } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type AppearanceSlice = Pick<SettingsLike, "brand">;

export function AppearanceForm({ initial }: { initial: SettingsLike }) {
  const { s, setS, pending, saved, error, onSubmit } = useSettingsSave<AppearanceSlice>({
    brand: initial.brand,
  });

  function patchBrand(k: keyof AppearanceSlice["brand"], v: string) {
    setS((prev) => ({ ...prev, brand: { ...prev.brand, [k]: v } }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="Brand palette" subtitle="Hex colors used by storefront design tokens.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ColorField label="Background" value={s.brand.backgroundHex ?? "#fafaf9"} onChange={(v) => patchBrand("backgroundHex", v)} />
          <ColorField label="Surface" value={s.brand.surfaceHex ?? "#ffffff"} onChange={(v) => patchBrand("surfaceHex", v)} />
          <ColorField label="Ink (text)" value={s.brand.inkHex ?? "#0a0a0b"} onChange={(v) => patchBrand("inkHex", v)} />
          <ColorField label="Accent" value={s.brand.accentHex ?? "#cdfb4a"} onChange={(v) => patchBrand("accentHex", v)} />
          <ColorField label="Accent ink" value={s.brand.accentInkHex ?? "#0a0a0b"} onChange={(v) => patchBrand("accentInkHex", v)} />
          <ColorField label="Muted" value={s.brand.mutedHex ?? "#6b6b70"} onChange={(v) => patchBrand("mutedHex", v)} />
          <ColorField label="Line" value={s.brand.lineHex ?? "#e6e6e3"} onChange={(v) => patchBrand("lineHex", v)} />
        </div>
        <p className="mt-3 text-xs text-muted">
          These colors are read by the storefront on every request. Restart the storefront app to refresh fully if you change the base background or ink.
        </p>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
