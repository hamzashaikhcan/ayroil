import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { HeroForm } from "./hero-form";

export default async function HeroSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Hero"
        subtitle="Headline, supporting copy, image, and buttons shown at the top of the homepage."
      />
      {settings ? <HeroForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
