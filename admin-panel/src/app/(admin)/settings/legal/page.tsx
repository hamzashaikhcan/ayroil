import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { LegalTabs } from "./legal-tabs";

export default async function LegalSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Legal & policies"
        subtitle="Shipping, returns, terms, and privacy — what customers see on each storefront policy page."
      />
      {settings ? <LegalTabs initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
