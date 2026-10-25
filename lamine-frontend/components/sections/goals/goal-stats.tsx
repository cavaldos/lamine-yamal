import { goalStats, type Goal } from "@/lib/goals";
import { useDict } from "@/lib/i18n/provider";

// Totals for whatever the filters currently show.
export default function GoalStats({ goals }: { goals: Goal[] }) {
  const t = useDict().goals;
  const s = goalStats(goals);
  const items: [string, string][] = [
    [String(s.goals), t.statGoals],
    [s.tracked ? s.xg.toFixed(1) : "—", t.statXg],
    [s.tracked ? `${s.dist.toFixed(1)}m` : "—", t.statDistance],
    [String(s.outside), t.statOutside],
  ];
  return (
    <dl className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
      {items.map(([value, label]) => (
        <div key={label} className="bg-bg-sunken px-4 py-3">
          <dt className="hud-label text-faint">{label}</dt>
          <dd className="mt-1 font-display text-2xl font-medium tracking-[-0.03em] text-ink-strong tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
