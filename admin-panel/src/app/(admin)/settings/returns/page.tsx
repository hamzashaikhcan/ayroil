import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { RichTextPageForm } from "../_shared/rich-text-page-form";

export default async function ReturnsPolicySettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Returns & refunds"
        subtitle="What customers see on the storefront /returns page. Window, eligibility, how to start a return."
      />
      {settings ? (
        <RichTextPageForm
          initial={settings}
          titleKey="returnsPolicyTitle"
          bodyKey="returnsPolicyBody"
          titleLabel="Returns page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full returns policy content."
          bodyHint="Rich text — headings, lists, links. Rendered as sanitized HTML on the storefront /returns page."
          placeholder="You have 30 days from delivery to start a return…"
        />
      ) : (
        <BackendUnreachable />
      )}
    </div>
  );
}
