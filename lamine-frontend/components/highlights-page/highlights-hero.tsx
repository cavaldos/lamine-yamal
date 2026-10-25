import Link from "next/link";
import CountUp from "@/components/ui/count-up";
import { HIGHLIGHTS } from "@/lib/content";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { lengthSeconds, SOURCES } from "@/lib/highlights";

const minutes = (s: number) => Math.round(s / 60);

// Top of /highlights: a way back and a few totals.
export default async function HighlightsHero() {
  const { highlightsPage: t, common } = await getDictionary();
  const locale = await getLocale();
  const stats: [number, string][] = [
    [HIGHLIGHTS.length, t.statVideos],
    [SOURCES.length - 1, t.statSources],
    [minutes(HIGHLIGHTS.reduce((n, v) => n + lengthSeconds(v), 0)), t.statMinutes],
    [minutes(Math.max(...HIGHLIGHTS.map(lengthSeconds))), t.statLongest],
  ];
  return (
    <header>
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3 md:px-10">
        <Link href={localePath(locale)} className="hud-label text-muted hover:text-ink">
          {common.home}
        </Link>
        <p className="hud-label text-faint">{t.badge}</p>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4">
        {stats.map(([value, label], i) => (
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
