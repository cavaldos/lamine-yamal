import Link from "next/link";
import CountUp from "@/components/ui/count-up";
import { HIGHLIGHTS } from "@/lib/content";
import { lengthSeconds, SOURCES } from "@/lib/highlights";

const minutes = (s: number) => Math.round(s / 60);

const STATS: [number, string][] = [
  [HIGHLIGHTS.length, "Video"],
  [SOURCES.length - 1, "Nguồn"],
  [minutes(HIGHLIGHTS.reduce((n, v) => n + lengthSeconds(v), 0)), "Phút nội dung"],
  [minutes(Math.max(...HIGHLIGHTS.map(lengthSeconds))), "Phút · video dài nhất"],
];

// Top of /highlights: a way back and a few totals.
export default function HighlightsHero() {
  return (
    <header>
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3 md:px-10">
        <Link href="/" className="hud-label text-muted hover:text-ink">
          ← Home
        </Link>
        <p className="hud-label text-faint">Highlights · Video</p>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4">
        {STATS.map(([value, label], i) => (
          <div
            key={label}
            className={`border-line px-6 py-4 md:px-10 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t md:border-t-0 md:border-l" : ""}`}
          >
            <dt className="hud-label text-faint">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong">
              <CountUp to={value} delay={200 + i * 90} />
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
