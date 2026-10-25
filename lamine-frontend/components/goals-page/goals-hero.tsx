import Link from "next/link";
import CountUp from "@/components/ui/count-up";
import { ALL_GOALS, SEASONS } from "@/lib/goals";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";

// Top of /goals: title, how the two modes work, a few totals.
export default async function GoalsHero() {
  const { goalsPage: t, common } = await getDictionary();
  const locale = await getLocale();
  const stats: [number, string][] = [
    [ALL_GOALS.length, t.statGoals],
    [ALL_GOALS.filter((g) => g.team === "Barcelona").length, t.statBarcelona],
    [ALL_GOALS.filter((g) => g.team === "Spain").length, t.statSpain],
    [SEASONS.length - 1, t.statSeasons],
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
