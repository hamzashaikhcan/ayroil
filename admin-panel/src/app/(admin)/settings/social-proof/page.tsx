import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { SocialProofTabs } from "./social-proof-tabs";

export default async function SocialProofSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Social proof"
        subtitle="Customer trust content shown on every product detail page — testimonial screenshots and the before/after slider."
      />
      {settings ? <SocialProofTabs initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
