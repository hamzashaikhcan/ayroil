import { cn } from "@/lib/utils";

function hashCode(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function ProductArt({
  seed,
  label,
  className,
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  const h = hashCode(seed);
  const angle = (h % 16) - 8;
  const ink = "#0a0a0b";
  const accent = "#cdfb4a";
  const bone = "#f4f1ea";
  const initials = (label ?? seed).slice(0, 2).toUpperCase();

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl", className)} style={{ background: bone }}>
      <svg viewBox="0 0 400 400" className="block h-full w-full" aria-hidden>
        <defs>
          <pattern id={`pa-${seed}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
            <circle cx="2" cy="2" r="0.8" fill={ink} opacity="0.16" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill={bone} />
        <rect width="400" height="400" fill={`url(#pa-${seed})`} />
        <g>
          <rect x="120" y="80" width="160" height="240" rx="14" fill={ink} />
          <rect x="120" y="80" width="160" height="40" rx="14" fill={accent} />
          <text x="200" y="108" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill={ink} letterSpacing="3">
            FORMULA · 01
          </text>
          <text x="200" y="220" textAnchor="middle" fontFamily="'Space Grotesk', system-ui, sans-serif" fontSize="64" fontWeight="700" fill={bone} letterSpacing="-2">
            {initials}
          </text>
          <rect x="140" y="280" width="120" height="2" fill={bone} opacity="0.25" />
          <text x="200" y="305" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill={bone} opacity="0.55" letterSpacing="3">
            NET 30 DAYS
          </text>
        </g>
        <g opacity="0.45">
          <rect x="24" y="24" width="14" height="1" fill={ink} />
          <rect x="24" y="24" width="1" height="14" fill={ink} />
          <rect x="362" y="24" width="14" height="1" fill={ink} />
          <rect x="375" y="24" width="1" height="14" fill={ink} />
          <rect x="24" y="375" width="14" height="1" fill={ink} />
          <rect x="24" y="362" width="1" height="14" fill={ink} />
          <rect x="362" y="375" width="14" height="1" fill={ink} />
          <rect x="375" y="362" width="1" height="14" fill={ink} />
        </g>
      </svg>
    </div>
  );
}
