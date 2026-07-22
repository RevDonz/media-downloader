import { cn } from "@/lib/utils";

// Server Component murni: SVG statis + animasi CSS (stroke-dashoffset).
// Tidak ada state/efek → tidak ada JS yang dikirim ke browser.
const COUNT = 18;
const W = 1200;
const H = 620;

function beamPath(i: number) {
  const t = i / (COUNT - 1);
  const x = t * W;
  const drift = Math.sin(i * 1.7) * 170; // deterministik → aman dari hydration mismatch
  const c1x = x + drift;
  const c2x = x - drift;
  const endX = x + drift * 0.35;
  return (
    `M${x.toFixed(1)} ${H + 60} ` +
    `C ${c1x.toFixed(1)} ${(H * 0.6).toFixed(1)}, ` +
    `${c2x.toFixed(1)} ${(H * 0.35).toFixed(1)}, ` +
    `${endX.toFixed(1)} -60`
  );
}

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <svg
        className="beams absolute inset-0 h-full w-full [filter:blur(0.4px)]"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Warna berkas memudar di ujung atas & bawah tiap kurva */}
          <linearGradient id="beam-line" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--tt-from)", stopOpacity: 0 }} />
            <stop offset="45%" style={{ stopColor: "var(--ig-via)", stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: "var(--ig-from)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {Array.from({ length: COUNT }, (_, i) => (
          <path
            key={i}
            d={beamPath(i)}
            pathLength={100}
            stroke="url(#beam-line)"
            strokeWidth={1.4}
            strokeLinecap="round"
            style={{
              animationDuration: `${5 + (i % 6)}s`,
              animationDelay: `${-(i % 9) * 0.8}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
