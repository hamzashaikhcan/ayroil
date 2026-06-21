"use client";

import { Card, Field } from "../_shared/fields";
import { StickySaveBar } from "../_shared/save-bar";
import { useSettingsSave } from "../_shared/use-settings-save";
import type { SettingsLike } from "../_shared/types";

type EmailSlice = Pick<SettingsLike, "resendApiKey" | "resendFromEmail">;

export function EmailForm({ initial }: { initial: SettingsLike }) {
  const slice: EmailSlice = {
    resendApiKey: initial.resendApiKey ?? "",
    resendFromEmail: initial.resendFromEmail ?? "",
  };

  const { s, patch, pending, saved, error, onSubmit } = useSettingsSave<EmailSlice>(slice);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card
        title="Resend"
        subtitle="Used to email customers an order confirmation right after checkout. Create a key at resend.com → API Keys."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Resend API key"
            value={s.resendApiKey}
            onChange={(v) => patch("resendApiKey", v)}
            placeholder="re_xxxxxxxxxxxxxxxx"
            type="password"
          />
          <Field
            label="From email"
            value={s.resendFromEmail}
            onChange={(v) => patch("resendFromEmail", v)}
            placeholder="Orders <orders@yourdomain.com>"
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          The from address must be on a domain verified in your Resend account. Leave either field empty to turn off order confirmation emails.
        </p>
      </Card>

      <StickySaveBar pending={pending} saved={saved} error={error} />
    </form>
  );
}
