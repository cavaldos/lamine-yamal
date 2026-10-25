import CountUp from "@/components/ui/count-up";
import GoalCount from "@/components/ui/goal-count";
import { AWARDS, COUNTRY_TITLE_COUNT, PLAYER, TEAM_TITLE_COUNT } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// The row of numbers along the bottom of the hero; they count up after the intro.
// 2 columns on phones, 3 on tablets, one row of 6 on wide screens.
export default async function HeroStats() {
  const { hero, trophies } = await getDictionary();
  // null = the goal total, which follows the live list.
  const stats: [number | string | null, string][] = [
    ["13 · 07 · 2007", hero.born],
    [PLAYER.shirt, hero.shirt],
    [TEAM_TITLE_COUNT, hero.teamTitles],
    [COUNTRY_TITLE_COUNT, trophies.countryTitles],
    [AWARDS.length, trophies.individualAwards],
    [null, hero.goals],
  ];
  return (
    // Cells draw their own top and right borders, so the grid lines stay right at every column count.
    <dl
      data-intro="true"
      style={{ animationDelay: "1100ms" }}
      className="relative z-40 mx-auto grid w-full max-w-[1280px] grid-cols-2 border-l border-line bg-bg/88 md:grid-cols-3 xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]"
    >
      {stats.map(([value, label], i) => (
        <div
          key={label}
          className="flex min-w-0 flex-col justify-between border-t border-r border-line px-6 py-4 md:px-8 xl:px-6"
        >
          <dt className="hud-label text-faint">{label}</dt>
          <dd className="mt-1 font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong">
            {typeof value === "string" ? (
              <span className="whitespace-nowrap text-2xl md:text-3xl">{value}</span>
            ) : value === null ? (
              <GoalCount delay={1200 + i * 90} />
            ) : (
              <CountUp to={value} delay={1200 + i * 90} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
