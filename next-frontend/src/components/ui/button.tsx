import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-tight transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ink";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-background hover:bg-ink-soft active:translate-y-px",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink hover:bg-background",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-red-600 text-white hover:bg-red-700 active:translate-y-px",
  accent: "bg-accent text-accent-ink hover:bg-accent-deep active:translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type ButtonAsButton = CommonProps & Omit<ComponentProps<"button">, "className"> & { href?: undefined };
type ButtonAsLink = CommonProps & Omit<ComponentProps<typeof Link>, "className"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  if ("href" in props && props.href) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    void _v; void _s; void _c; void _ch;
    return <Link className={classes} {...rest}>{children}</Link>;
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as ButtonAsButton;
  void _v; void _s; void _c; void _ch;
  return <button className={classes} {...rest}>{children}</button>;
}
