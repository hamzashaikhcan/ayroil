import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { TestimonialsForm } from "./testimonials-form";

export default async function TestimonialsSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Testimonials"
        subtitle="Screenshot-style customer proof (WhatsApp/Instagram DMs, reviews, etc). Shown identically on every product detail page."
      />
      {settings ? <TestimonialsForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
