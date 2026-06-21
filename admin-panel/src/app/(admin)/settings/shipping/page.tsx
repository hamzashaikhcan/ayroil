import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { RichTextPageForm } from "../_shared/rich-text-page-form";

export default async function ShippingPolicySettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipping policy"
        subtitle="What customers see on the storefront /shipping page. Methods, timing, free-ship threshold, international rules."
      />
      {settings ? (
        <RichTextPageForm
          initial={settings}
          titleKey="shippingPolicyTitle"
          bodyKey="shippingPolicyBody"
          titleLabel="Shipping page"
          bodyLabel="Body"
          titleHint="Title is the H1; body is the full shipping policy content."
          bodyHint="Rich text — headings, lists, links. Rendered as sanitized HTML on the storefront /shipping page."
          placeholder="Standard shipping arrives in 3-5 business days. Orders over $50 ship free…"
        />
      ) : (
        <BackendUnreachable />
      )}
    </div>
  );
}
