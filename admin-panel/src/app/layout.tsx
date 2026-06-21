import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { fetchPublicBranding } from "@/lib/public-branding";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, iconUrl } = await fetchPublicBranding();
  return {
    title: { default: `${siteName} · Admin`, template: `%s · ${siteName} Admin` },
    description: `Internal admin console for ${siteName}.`,
    robots: { index: false, follow: false },
    icons: iconUrl ? { icon: iconUrl, shortcut: iconUrl, apple: iconUrl } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#0f1116" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

