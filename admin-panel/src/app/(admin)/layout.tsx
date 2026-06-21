import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES, SITE } from "@consts";
import { AdminShell } from "@/components/layout/shell";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { fetchSettingsForAdmin } from "./settings/_shared/fetch-settings";
import { setActiveCurrency } from "@/lib/utils";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== ROLES.ADMIN) redirect("/login");

  const settings = await fetchSettingsForAdmin();
  const currency = {
    code: settings?.currencyCode ?? SITE.currency.code,
    symbol: settings?.currencySymbol ?? SITE.currency.symbol,
    locale: settings?.currencyLocale ?? SITE.currency.locale,
  };
  setActiveCurrency(currency);

  const siteName = settings?.siteName?.trim() || SITE.siteName;
  const storefrontUrl = SITE.storefrontUrl;
  const logoUrl = settings?.darkLogoUrl || SITE.darkLogoUrl;

  return (
    <CurrencyProvider config={currency}>
      <AdminShell
        email={session.user.email}
        siteName={siteName}
        storefrontUrl={storefrontUrl}
        logoUrl={logoUrl}
      >
        {children}
      </AdminShell>
    </CurrencyProvider>
  );
}
