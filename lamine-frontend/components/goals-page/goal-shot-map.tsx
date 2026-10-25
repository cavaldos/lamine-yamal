"use client";

import { useState } from "react";
import GoalStats from "@/components/sections/goals/goal-stats";
import ShotLegend from "@/components/sections/goals/shot-legend";
import ShotPitch from "@/components/sections/goals/shot-pitch";
import { ALL_GOALS, fmtDate, goalTitle, type Goal } from "@/lib/goals";
import { useDict } from "@/lib/i18n/provider";

// The shot map on /goals. It follows the toolbar's filters: goals outside them
// fade out and can't be clicked. Clicking a dot opens that goal's video in the
// current viewing mode.
export default function GoalShotMap({ goals, onPlay }: { goals: Goal[]; onPlay: (goal: Goal) => void }) {
  const t = useDict().goalsPage;
  const [hover, setHover] = useState<Goal | null>(null);
  const shown = new Set(goals.map((g) => g.id));
  // Hover state can outlive a filter change; only preview goals that are still visible.
  const preview = hover && shown.has(hover.id) ? hover : null;
  const focus = preview ?? goals[0];
  if (!focus) return null;

  return (
    <section aria-label={t.shotMap} className="border-b border-line bg-bg-sunken p-4 md:p-8">
      <div className="mx-auto max-w-[720px]">
        <ShotLegend />
        <ShotPitch goals={ALL_GOALS} shown={shown} focus={focus} onHover={setHover} onSelect={onPlay} />
        <p className="hud-label mt-3 min-h-5 text-muted" aria-live="polite">
          {preview ? (
            <>
              <span className="text-garnet-ink">#{preview.n}</span> {goalTitle(preview)} · {preview.minute} ·{" "}
              {fmtDate(preview.date)} <span className="text-faint">{t.clickToWatch}</span>
            </>
          ) : (
            <span className="text-faint">{t.hoverHint}</span>
          )}
        </p>
        <GoalStats goals={goals} />
      </div>
    </section>
  );
}
