import Link from "next/link";
import type { ReactElement, SVGProps } from "react";
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
  {
    title: "Guides",
    links: [
      { href: "/how-to-use-ayroil-hair-oil", label: "How to use Ayroil" },
      { href: "/ayroil-ingredients", label: "Ingredients" },
      { href: "/hair-oil-for-dry-scalp", label: "Dry scalp guide" },
      { href: "/best-hair-oil-for-dandruff-prone-scalp-pakistan", label: "Dandruff-prone care" },
      { href: "/onion-oil-black-seed-oil-pumpkin-seed-oil-benefits", label: "Key oil benefits" },
      { href: "/doctor-guided-hair-oil-pakistan", label: "Doctor-guided oil" },
    ],
  },
];

type SocialKey = keyof Settings["social"];

const SOCIAL_LINKS: {
  key: SocialKey;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "x", label: "X", Icon: XIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
];

export function Footer({ settings }: { settings: Settings }) {
  const socialLinks = SOCIAL_LINKS
    .map((item) => ({ ...item, href: settings.social?.[item.key] }))
    .filter((item): item is typeof item & { href: string } => Boolean(item.href));

  return (
		<footer className='mt-16 border-t border-line bg-surface md:mt-24'>
			<Container className='py-10 md:py-16'>
				<div className='grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12'>
					<div className='col-span-2 md:col-span-1'>
						<Wordmark size='lg' />
						<p className='mt-4 max-w-xs text-sm leading-relaxed text-muted'>
							{settings.shortDescription}
						</p>
						<div className='mt-6 space-y-1.5 font-mono text-xs tracking-wide text-muted'>
							{settings.address ? <div>{settings.address}</div> : null}
							{settings.supportEmail ? (
								<div className='break-all'>{settings.supportEmail}</div>
							) : null}
							{settings.phone ? <div>{settings.phone}</div> : null}
						</div>
						{socialLinks.length ? (
							<div className='mt-6 flex flex-wrap items-center gap-2'>
								{socialLinks.map(({ href, label, Icon }) => (
									<Link
										key={label}
										href={href}
										aria-label={label}
										title={label}
										target='_blank'
										rel='noreferrer'
										className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-ink hover:text-ink'>
										<Icon className='h-4 w-4' aria-hidden='true' />
									</Link>
								))}
							</div>
						) : null}
					</div>
					{COLS.map((col) => (
						<div key={col.title}>
							<div className='font-mono text-xs uppercase tracking-[0.22em] text-muted'>
								{col.title}
							</div>
							<ul className='mt-4 space-y-2.5'>
								{col.links.map((l) => (
									<li key={l.href}>
										<Link
											href={l.href}
											className='text-sm text-ink hover:underline underline-offset-4'>
											{l.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className='mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 md:flex-row md:items-center md:mt-14'>
					<div className='font-mono text-xs uppercase tracking-[0.2em] text-muted'>
						©{new Date().getFullYear()}{' '}
						{settings.companyName || settings.siteName} · All rights reserved
					</div>
					<div className='flex items-center gap-4 text-xs text-muted'>
						<Link href='/terms' className='hover:text-ink'>
							Terms of Service
						</Link>
						<Link href='/privacy' className='hover:text-ink'>
							Privacy Policy
						</Link>
					</div>
				</div>
			</Container>
		</footer>
	);
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.9 10.7 21.3 2h-1.8l-6.4 7.5L8 2H2l7.8 11.4L2 22h1.8l6.8-7.9L16 22h6l-8.1-11.3Zm-2.4 2.8-.8-1.1L4.4 3.3h2.8l5 7.2.8 1.1 6.6 9.4h-2.8l-5.3-7.5Z" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12s0-4.2-.5-5.4a2.8 2.8 0 0 0-2-2C16.8 4 12 4 12 4s-4.8 0-6.5.6a2.8 2.8 0 0 0-2 2C3 7.8 3 12 3 12s0 4.2.5 5.4a2.8 2.8 0 0 0 2 2C7.2 20 12 20 12 20s4.8 0 6.5-.6a2.8 2.8 0 0 0 2-2c.5-1.2.5-5.4.5-5.4Z" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 3v10.7a4.3 4.3 0 1 1-4.3-4.3" />
      <path d="M14 3c.6 3.3 2.5 5.2 5.6 5.7" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 8.2V6.4c0-.8.2-1.3 1.4-1.3H17V2.2c-.8-.1-1.7-.2-2.5-.2-2.6 0-4.4 1.6-4.4 4.5v1.7H7.2v3.3h2.9V22H14V11.5h2.8l.4-3.3H14Z" />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.7 8.8H3.2V21h3.5V8.8ZM5 3a2 2 0 1 0 0 4.1A2 2 0 0 0 5 3Zm16 10.8c0-3.3-1.8-5.3-4.6-5.3-1.8 0-3 .9-3.5 1.8V8.8H9.5V21H13v-6.6c0-1.7.8-2.7 2.2-2.7 1.3 0 2.1.9 2.1 2.7V21H21v-7.2Z" />
    </svg>
  );
}
