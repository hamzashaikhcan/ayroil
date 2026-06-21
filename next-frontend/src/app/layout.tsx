import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { SITE } from "@consts";
import { Providers } from "@/components/providers";
import { SettingsProvider } from "@/components/providers/settings-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { fetchSettings } from "@/lib/settings";
import { brandStyle } from "@/lib/brand-style";
import { setActiveCurrency } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const settings = await fetchSettings();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? settings.domain;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const ogImages = settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined;

  return {
    metadataBase: new URL(base),
    title: { default: `${settings.siteName} — ${settings.slogan}`, template: `%s · ${settings.siteName}` },
    description: settings.shortDescription,
    applicationName: settings.siteName,
    alternates: { canonical: "/" },
    icons: (() => {
      const icon = settings.iconUrl || SITE.iconUrl;
      return icon ? { icon, shortcut: icon, apple: icon } : undefined;
    })(),
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: `${settings.siteName} — ${settings.slogan}`,
      description: settings.shortDescription,
      url: "/",
      locale: "en_US",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.siteName} — ${settings.slogan}`,
      description: settings.shortDescription,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await fetchSettings();
  return {
    themeColor: settings.brand?.backgroundHex ?? SITE.brand.backgroundHex,
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSettings();
  setActiveCurrency({
    code: settings.currencyCode,
    symbol: settings.currencySymbol,
    locale: settings.currencyLocale,
  });

  const lang = (settings.currencyLocale && /^[a-z]{2}(-[A-Z]{2})?$/.test(settings.currencyLocale))
    ? settings.currencyLocale
    : "en";

  const sameAs = [
    settings.social?.instagram,
    settings.social?.x,
    settings.social?.youtube,
    settings.social?.tiktok,
    settings.social?.facebook,
    settings.social?.linkedin,
  ].filter((u): u is string => Boolean(u));

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: "/",
    logo: settings.darkLogoUrl || settings.iconUrl || undefined,
    description: settings.shortDescription,
    email: settings.supportEmail || undefined,
    telephone: settings.phone || undefined,
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={brandStyle(settings)}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-ink flex flex-col" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <SettingsProvider value={settings}>
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer settings={settings} />
          </Providers>
        </SettingsProvider>
      </body>
    </html>
  );
}
