import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { BeforeAfterForm } from "./before-after-form";

export default async function BeforeAfterSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Before / after"
        subtitle="A single comparison slider shown on every product detail page. Leave either image empty to hide the section."
      />
      {settings ? <BeforeAfterForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
