import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "soft" | "outline" | "recommend";

const tones: Record<Tone, string> = {
  neutral: "bg-ink text-background",
  accent: "bg-accent text-accent-ink",
  soft: "bg-ink/5 text-ink",
  outline: "bg-transparent text-ink border border-line-strong",
  recommend: "bg-amber-500 text-white",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono uppercase tracking-[0.18em]", tones[tone], className)}>
      {children}
    </span>
  );
}
