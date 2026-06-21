import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { AppearanceForm } from "./appearance-form";

export default async function AppearanceSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Appearance"
        subtitle="Brand palette used by the storefront's design tokens. Changes restart the app to take full effect."
      />
      {settings ? <AppearanceForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
