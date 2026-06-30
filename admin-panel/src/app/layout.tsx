import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { fetchPublicBranding } from "@/lib/public-branding";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await fetchPublicBranding();
  return {
    title: { default: `${siteName} · Admin`, template: `%s · ${siteName} Admin` },
    description: `Internal admin console for ${siteName}.`,
    robots: { index: false, follow: false },
    manifest: "/manifest.webmanifest",
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
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: `${siteName} Admin`,
    },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-ink">
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

