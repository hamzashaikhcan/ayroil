import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { Container } from "@/components/ui/container";
import { Wordmark } from "./wordmark";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/shop", label: "Shop" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/benefits", label: "Benefits" },
      { href: "/shipping", label: "Shipping" },
      { href: "/returns", label: "Returns" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-16 border-t border-line bg-surface md:mt-24">
      <Container className="py-10 md:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Wordmark size="lg" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{settings.shortDescription}</p>
            <div className="mt-6 space-y-1.5 font-mono text-xs uppercase tracking-[0.15em] text-muted">
              {settings.address ? <div>{settings.address}</div> : null}
              {settings.supportEmail ? <div className="break-all">{settings.supportEmail}</div> : null}
              {settings.phone ? <div>{settings.phone}</div> : null}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink hover:underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 md:flex-row md:items-center md:mt-14">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            © {new Date().getFullYear()} {settings.companyName || settings.siteName} · All rights reserved
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
