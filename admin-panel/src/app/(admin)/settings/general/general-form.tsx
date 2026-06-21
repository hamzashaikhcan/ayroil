"use client";

import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { Card, Field, NumberField, TextField } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type GeneralSlice = Pick<
  SettingsLike,
  | "siteName"
  | "slogan"
  | "shortDescription"
  | "longDescription"
  | "iconUrl"
  | "whiteLogoUrl"
  | "darkLogoUrl"
  | "ogImageUrl"
  | "domain"
  | "supportEmail"
  | "salesEmail"
  | "phone"
  | "address"
  | "social"
  | "companyName"
  | "foundedYear"
  | "taxId"
>;

export function GeneralForm({ initial }: { initial: SettingsLike }) {
  const slice: GeneralSlice = {
    siteName: initial.siteName,
    slogan: initial.slogan,
    shortDescription: initial.shortDescription,
    longDescription: initial.longDescription,
    iconUrl: initial.iconUrl,
    whiteLogoUrl: initial.whiteLogoUrl,
    darkLogoUrl: initial.darkLogoUrl,
    ogImageUrl: initial.ogImageUrl,
    domain: initial.domain,
    supportEmail: initial.supportEmail,
    salesEmail: initial.salesEmail,
    phone: initial.phone,
    address: initial.address,
    social: initial.social,
    companyName: initial.companyName,
    foundedYear: initial.foundedYear,
    taxId: initial.taxId,
  };

  const { s, setS, patch, pending, saved, error, onSubmit } = useSettingsSave<GeneralSlice>(slice);

  function patchSocial(k: keyof GeneralSlice["social"], v: string) {
    setS((prev) => ({ ...prev, social: { ...prev.social, [k]: v || null } }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="Brand identity" subtitle="Shown in the navbar, footer, OpenGraph, and email.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Site name" value={s.siteName} onChange={(v) => patch("siteName", v)} required />
          <Field label="Slogan" value={s.slogan} onChange={(v) => patch("slogan", v)} />
          <TextField label="Short description" value={s.shortDescription} onChange={(v) => patch("shortDescription", v)} className="md:col-span-2" rows={2} />
          <TextField label="Long description" value={s.longDescription} onChange={(v) => patch("longDescription", v)} className="md:col-span-2" rows={4} />
        </div>
      </Card>

      <Card title="Logos & images" subtitle="Drop or click to upload directly to Cloudinary. Use transparent PNG/SVG for logos.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SingleImageUpload
            label="Site icon (favicon)"
            value={s.iconUrl}
            onChange={(v) => patch("iconUrl", v)}
            hint="32×32 or square SVG"
            transparent
          />
          <SingleImageUpload
            label="Light logo"
            value={s.whiteLogoUrl}
            onChange={(v) => patch("whiteLogoUrl", v)}
            hint="For dark headers"
            aspect="wide"
            transparent
          />
          <SingleImageUpload
            label="Dark logo"
            value={s.darkLogoUrl}
            onChange={(v) => patch("darkLogoUrl", v)}
            hint="For light headers"
            aspect="wide"
            transparent
          />
          <SingleImageUpload
            label="OpenGraph image"
            value={s.ogImageUrl}
            onChange={(v) => patch("ogImageUrl", v)}
            hint="1200×630 social card"
            aspect="wide"
          />
        </div>
      </Card>

      <Card title="Contact & presence">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Domain" value={s.domain} onChange={(v) => patch("domain", v)} placeholder="example.com" />
          <Field label="Phone" value={s.phone} onChange={(v) => patch("phone", v)} />
          <Field label="Support email" value={s.supportEmail} onChange={(v) => patch("supportEmail", v)} />
          <Field label="Sales email" value={s.salesEmail} onChange={(v) => patch("salesEmail", v)} />
          <Field label="Address" value={s.address} onChange={(v) => patch("address", v)} className="md:col-span-2" />
        </div>
      </Card>

      <Card title="Social">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Instagram URL" value={s.social.instagram ?? ""} onChange={(v) => patchSocial("instagram", v)} />
          <Field label="X / Twitter URL" value={s.social.x ?? ""} onChange={(v) => patchSocial("x", v)} />
          <Field label="YouTube URL" value={s.social.youtube ?? ""} onChange={(v) => patchSocial("youtube", v)} />
          <Field label="TikTok URL" value={s.social.tiktok ?? ""} onChange={(v) => patchSocial("tiktok", v)} />
          <Field label="Facebook URL" value={s.social.facebook ?? ""} onChange={(v) => patchSocial("facebook", v)} />
          <Field label="LinkedIn URL" value={s.social.linkedin ?? ""} onChange={(v) => patchSocial("linkedin", v)} />
        </div>
      </Card>

      <Card title="Legal">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Company name" value={s.companyName} onChange={(v) => patch("companyName", v)} className="md:col-span-2" />
          <NumberField label="Founded year" value={s.foundedYear} onChange={(v) => patch("foundedYear", v)} />
          <Field label="Tax ID" value={s.taxId} onChange={(v) => patch("taxId", v)} className="md:col-span-2" />
        </div>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
