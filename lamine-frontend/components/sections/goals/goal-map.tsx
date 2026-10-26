"use client";

import { useMemo, useState } from "react";
import FilterChips from "@/components/ui/filter-chips";
import FilterMenu from "@/components/sections/goals/filter-menu";
import GoalDetail from "@/components/sections/goals/goal-detail";
import GoalPreview from "@/components/sections/goals/goal-preview";
import GoalList from "@/components/sections/goals/goal-list";
import GoalStats from "@/components/sections/goals/goal-stats";
import ShotLegend from "@/components/sections/goals/shot-legend";
import { playGoal } from "@/components/sections/goals/play-goal";
import ShotPitch from "@/components/sections/goals/shot-pitch";
import { ALL, KINDS, kindLabels, seasonLabels, seasonsOf, type Goal } from "@/lib/goals";
import { useGoals } from "@/lib/goals-store";
import { useDict } from "@/lib/i18n/provider";

// The interactive part of the goals section. Owns the filter, the selected goal
// and the hovered goal; hovering previews a goal, clicking pins it and plays its clip.
export default function GoalMap({ action }: { action?: React.ReactNode }) {
  const dict = useDict();
  const goals = useGoals();
  const seasons = useMemo(() => seasonsOf(goals), [goals]);
  const [season, setSeason] = useState(ALL);
  const [kind, setKind] = useState(0);
  // Nothing picked yet: show the latest goal.
  const [picked, setSelected] = useState<Goal | null>(null);
  const selected = picked ?? goals[goals.length - 1];
  const [hover, setHover] = useState<Goal | null>(null);

  const visible = useMemo(
    () => goals.filter((g) => (season === ALL || g.season === season) && KINDS[kind][1](g)),
    [goals, season, kind],
  );
  const shown = useMemo(() => new Set(visible.map((g) => g.id)), [visible]);
  const focus = hover ?? selected;
  const pick = (g: Goal) => {
    setSelected(g);
    playGoal(g, dict);
  };

  return (
    <div className="grid gap-px border-t border-line bg-line lg:grid-cols-[1.05fr_1fr]">
      <div className="relative bg-bg-sunken p-4 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {action}
          <ShotLegend />
        </div>
        <ShotPitch goals={goals} shown={shown} focus={focus} onHover={setHover} onSelect={pick} />
        <GoalStats goals={visible} />
        <GoalPreview goal={hover} />
      </div>

      <div className="flex min-w-0 flex-col bg-bg">
        <div className="flex items-center border-b border-line px-6 py-3 md:px-8">
          <FilterMenu
            label={dict.goalsPage.filters}
            summary={`${seasonLabels(dict, seasons)[seasons.indexOf(season)]} · ${kindLabels(dict)[kind]}`}
          >
            <FilterChips
              label={dict.goalsPage.filterSeason}
              items={seasonLabels(dict, seasons)}
              value={seasons.indexOf(season)}
              onChange={(i) => setSeason(seasons[i])}
            />
            <FilterChips label={dict.goalsPage.filterKind} items={kindLabels(dict)} value={kind} onChange={setKind} />
          </FilterMenu>
        </div>
        <GoalDetail goal={focus} />
        <GoalList goals={visible} selectedId={selected.id} onSelect={pick} onHover={setHover} />
      </div>
    </div>
  );
}
