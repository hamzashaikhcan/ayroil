import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { RichTextPageForm } from "../_shared/rich-text-page-form";

export default async function PrivacySettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Privacy policy"
        subtitle="What customers see on the storefront /privacy page. Be specific about what you collect and why."
      />
      {settings ? (
        <RichTextPageForm
          initial={settings}
          titleKey="privacyTitle"
          bodyKey="privacyBody"
          titleLabel="Privacy page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full privacy policy content."
          bodyHint="Rich text · headings, lists, links. Rendered as sanitized HTML on the storefront /privacy page."
          placeholder="What we collect — Account information you provide, order history, and basic analytics…"
          aiPage="privacy"
        />
      ) : (
        <BackendUnreachable />
      )}
    </div>
  );
}
