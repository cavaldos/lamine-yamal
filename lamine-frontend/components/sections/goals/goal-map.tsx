"use client";

import { useMemo, useState } from "react";
import FilterChips from "@/components/ui/filter-chips";
import GoalDetail from "@/components/sections/goals/goal-detail";
import GoalList from "@/components/sections/goals/goal-list";
import GoalStats from "@/components/sections/goals/goal-stats";
import ShotLegend from "@/components/sections/goals/shot-legend";
import { playGoal } from "@/components/sections/goals/play-goal";
import ShotPitch from "@/components/sections/goals/shot-pitch";
import { ALL, ALL_GOALS, KINDS, SEASONS, shortSeason, type Goal } from "@/lib/goals";

// The interactive part of the goals section. Owns the filter, the selected goal
// and the hovered goal; hovering previews a goal, clicking pins it and plays its clip.
export default function GoalMap() {
  const [season, setSeason] = useState(ALL);
  const [kind, setKind] = useState(0);
  const [selected, setSelected] = useState<Goal>(ALL_GOALS[ALL_GOALS.length - 1]);
  const [hover, setHover] = useState<Goal | null>(null);

  const visible = useMemo(
    () => ALL_GOALS.filter((g) => (season === ALL || g.season === season) && KINDS[kind][1](g)),
    [season, kind],
  );
  const shown = useMemo(() => new Set(visible.map((g) => g.id)), [visible]);
  const focus = hover ?? selected;
  const pick = (g: Goal) => {
    setSelected(g);
    playGoal(g);
  };

  return (
    <div className="grid gap-px border-t border-line bg-line lg:grid-cols-[1.05fr_1fr]">
      <div className="relative bg-bg-sunken p-4 md:p-8">
        <ShotLegend />
        <ShotPitch goals={ALL_GOALS} shown={shown} focus={focus} onHover={setHover} onSelect={pick} />
        <GoalStats goals={visible} />
      </div>

      <div className="flex min-w-0 flex-col bg-bg">
        <div className="flex flex-col gap-3 border-b border-line px-6 py-5 md:px-8">
          <FilterChips
            label="Mùa giải"
            items={SEASONS.map((s) => (s === ALL ? s : shortSeason(s)))}
            value={SEASONS.indexOf(season)}
            onChange={(i) => setSeason(SEASONS[i])}
          />
          <FilterChips label="Kiểu" items={KINDS.map(([k]) => k)} value={kind} onChange={setKind} />
        </div>
        <GoalDetail key={focus.id} goal={focus} />
        <GoalList goals={visible} selectedId={selected.id} onSelect={pick} onHover={setHover} />
      </div>
    </div>
  );
}
