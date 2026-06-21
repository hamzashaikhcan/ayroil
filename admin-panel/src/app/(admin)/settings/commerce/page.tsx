import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { CommerceForm } from "./commerce-form";

export default async function CommerceSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Commerce"
        subtitle="Currency, shipping rates, and return window — what the checkout and product pages use."
      />
      {settings ? <CommerceForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
