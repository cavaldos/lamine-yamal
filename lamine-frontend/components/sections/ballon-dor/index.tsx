import EditionCard from "@/components/sections/ballon-dor/edition-card";
import PointerGlow from "@/components/ui/pointer-glow";
import Section from "@/components/ui/section";
import { BALLON_DOR } from "@/lib/content";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";

// Where he finished in the men's Ballon d'Or: a row of totals, then one card per
// edition, oldest first, so the climb reads left to right.
// The data lives in BALLON_DOR in lib/content.ts; add a year there after each ceremony.
export default async function BallonDorSection() {
  const { ballonDor: t } = await getDictionary();
  const locale = await getLocale();
  const nf = new Intl.NumberFormat(locale);
  const num = (n: number) => nf.format(n);

  const best = BALLON_DOR.reduce((a, b) => (b.rank < a.rank ? b : a));
  // One scale for every bar on the section.
  const max = Math.max(...BALLON_DOR.flatMap((e) => [e.points, ...e.top.map((p) => p.points)]));
  const stats: [value: string, label: string, note?: string][] = [
    [String(BALLON_DOR.length), t.nominations],
    [`#${best.rank}`, t.bestFinish, best.year],
    [String(BALLON_DOR.filter((e) => e.rank <= 3).length), t.podiums],
  ];

  return (
    <Section id="ballonDor">
      <dl className="grid grid-cols-3 gap-px bg-line">
        {stats.map(([value, label, note]) => (
          <div key={label} data-reveal="true" className="min-w-0 bg-bg px-4 py-5 sm:px-6 md:px-10 md:py-8">
            <dt className="hud-label leading-snug text-faint">{label}</dt>
            <dd className="mt-2 flex flex-wrap items-baseline gap-x-2 font-display text-4xl font-medium tracking-[-0.04em] text-ink-strong md:text-5xl">
              {value}
              {note && <span className="hud-label tracking-normal text-faint">{note}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <PointerGlow className="grid gap-px border-t border-line bg-line md:grid-cols-3">
        {BALLON_DOR.map((e) => (
          <EditionCard key={e.year} edition={e} max={max} t={t} num={num} />
        ))}
      </PointerGlow>

      <p className="hud-label border-t border-line px-6 py-3 text-faint md:px-10">{t.footnote}</p>
    </Section>
  );
}
