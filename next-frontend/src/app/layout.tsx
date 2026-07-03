import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { SITE } from "@consts";
import { Providers } from "@/components/providers";
import { SettingsProvider } from "@/components/providers/settings-context";
import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { fetchSettings } from "@/lib/settings";
import { brandStyle } from "@/lib/brand-style";
import { setActiveCurrency } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });
const GA_MEASUREMENT_ID = "G-ECSBHST4TC";
const META_PIXEL_ID = "1631927431705759";

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
    icons: {
      icon: [
        { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicons/favicon.ico",
      apple: "/favicons/apple-touch-icon.png",
    },
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
        {/* Stubs define window.gtag/fbq and their call queues immediately
            (afterInteractive, negligible cost) so events fired by user
            interactions are queued correctly even before the real GA/Pixel
            scripts below have finished loading. The external scripts stay
            lazyOnload since they're the actual network-weight cost. */}
        <Script id="google-analytics-stub" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script id="meta-pixel-stub" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        <noscript>
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <SettingsProvider value={settings}>
          <Providers>
            <AnnouncementBar settings={settings} />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer settings={settings} />
            <WhatsAppButton />
          </Providers>
        </SettingsProvider>
      </body>
    </html>
  );
}
