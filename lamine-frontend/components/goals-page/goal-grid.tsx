import GoalCard from "@/components/goals-page/goal-card";
import { shortSeason, type Goal } from "@/lib/goals";

// Hairlines come from each card's outline, so a short last row leaves no grey gap.
const grid = "grid grid-cols-2 gap-px p-px sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

// The goals as a grid of posters. Sorted by date, they are split into seasons.
export default function GoalGrid({
  goals,
  bySeason,
  onOpen,
}: {
  goals: Goal[];
  bySeason: boolean;
  onOpen: (index: number) => void;
}) {
  if (!bySeason) {
    return (
      <div className={grid}>
        {goals.map((g, i) => (
          <GoalCard key={g.id} goal={g} onOpen={() => onOpen(i)} />
        ))}
      </div>
    );
  }

  // Consecutive runs of the same season, keeping each goal's index in `goals`.
  const groups: { season: string; items: [Goal, number][] }[] = [];
  goals.forEach((g, i) => {
    const last = groups.at(-1);
    if (last?.season === g.season) last.items.push([g, i]);
    else groups.push({ season: g.season, items: [[g, i]] });
  });

  return (
    <div>
      {groups.map(({ season, items }) => (
        <section key={season} aria-label={`Mùa ${season}`}>
          <header className="flex items-baseline justify-between gap-4 border-b border-line px-6 py-4 md:px-10">
            <h2 className="font-display text-2xl font-medium tracking-[-0.03em] text-ink-strong">
              Mùa {shortSeason(season)}
            </h2>
            <p className="hud-label text-faint">{items.length} bàn</p>
          </header>
          <div className={`${grid} border-b border-line`}>
            {items.map(([g, i]) => (
              <GoalCard key={g.id} goal={g} onOpen={() => onOpen(i)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
