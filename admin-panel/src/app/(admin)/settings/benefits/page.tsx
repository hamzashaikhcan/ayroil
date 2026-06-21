import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { BenefitsForm } from "./benefits-form";

export default async function BenefitsSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Benefits page"
        subtitle="What customers see on the storefront /benefits page. Rich text — headings, lists, links, bold and italic."
      />
      {settings ? <BenefitsForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
