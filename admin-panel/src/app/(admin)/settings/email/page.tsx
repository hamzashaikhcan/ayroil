import { PageHeader } from "@/components/ui/page-header";
import { fetchSettingsForAdmin } from "../_shared/fetch-settings";
import { BackendUnreachable } from "../_shared/backend-unreachable";
import { EmailForm } from "./email-form";

export default async function EmailSettingsPage() {
  const settings = await fetchSettingsForAdmin();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Email"
        subtitle="Connect Resend to send customers an order confirmation email at checkout."
      />
      {settings ? <EmailForm initial={settings} /> : <BackendUnreachable />}
    </div>
  );
}
