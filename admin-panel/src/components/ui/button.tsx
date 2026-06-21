import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-accent";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.08)] hover:bg-ink-soft active:translate-y-px",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-[0_1px_0_rgba(0,0,0,0.02)] hover:bg-surface-2",
  ghost: "bg-transparent text-ink hover:bg-ink/[0.04]",
  danger: "bg-bad text-white hover:bg-[#9a1f14] active:translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type AsButton = CommonProps & Omit<ComponentProps<"button">, "className"> & { href?: undefined };
type AsLink = CommonProps & Omit<ComponentProps<typeof Link>, "className"> & { href: string };

export function Button(props: AsButton | AsLink) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  if ("href" in props && props.href) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    void _v; void _s; void _c; void _ch;
    return <Link className={classes} {...rest}>{children}</Link>;
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as AsButton;
  void _v; void _s; void _c; void _ch;
  return <button className={classes} {...rest}>{children}</button>;
}
