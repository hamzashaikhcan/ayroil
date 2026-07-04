import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { RichTextPageForm } from "../_shared/rich-text-page-form";

export default async function TermsSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Terms of service"
        subtitle="What customers see on the storefront /terms page. Rich text — headings, lists, links, bold and italic."
      />
      {settings ? (
        <RichTextPageForm
          initial={settings}
          titleKey="termsTitle"
          bodyKey="termsBody"
          titleLabel="Terms page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full terms content."
          bodyHint="Rich text · headings, lists, links. Rendered as sanitized HTML on the storefront /terms page."
          placeholder="1. Orders — All orders are subject to acceptance and availability…"
          aiPage="terms"
        />
      ) : (
        <BackendUnreachable />
      )}
    </div>
  );
}
