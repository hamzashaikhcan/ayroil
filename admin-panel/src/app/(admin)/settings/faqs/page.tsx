import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { FaqsForm } from "./faqs-form";

export default async function FaqsSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="FAQs"
        subtitle="Site-wide questions and answers. Rendered on the storefront /faq page and the homepage FAQ section."
      />
      {settings ? <FaqsForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
