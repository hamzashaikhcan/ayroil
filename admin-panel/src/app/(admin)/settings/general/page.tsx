import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { GeneralForm } from "./general-form";

export default async function GeneralSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="General"
        subtitle="Brand identity, logos, contact details, social links, and legal information."
      />
      {settings ? <GeneralForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
