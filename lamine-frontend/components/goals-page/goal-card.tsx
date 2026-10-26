"use client";

import HoverPreview, { useHoverPreview } from "@/components/ui/hover-preview";
import { Play } from "@/components/ui/icons";
import Poster from "@/components/goals-page/poster";
import {
  bodyLabel,
  competitionLabel,
  fmtDate,
  goalTitle,
  goalVideo,
  tone,
  typeLabel,
  type Goal,
} from "@/lib/goals";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";

// One goal in the grid: a 9:16 poster, like a short-video feed. Hovering plays the clip muted in place.
export default function GoalCard({ goal, onOpen }: { goal: Goal; onOpen: () => void }) {
  const dict = useDict();
  const video = goalVideo(goal);
  const penalty = goal.type === "Penalty";
  const { active, handlers } = useHoverPreview();

  return (
    <button
      type="button"
      onClick={onOpen}
      {...handlers}
      aria-label={format(dict.goals.shotAria, { n: goal.n, title: goalTitle(goal), minute: goal.minute })}
      className="thumb-zoom group relative block aspect-[9/16] w-full overflow-hidden bg-bg-sunken text-left text-white outline outline-line focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Poster video={video} className="absolute inset-0 h-full w-full object-cover" />
      {active && <HoverPreview id={video.id} start={video.start} end={video.end} vertical={video.vertical} cover />}
      <span aria-hidden className="absolute inset-0 bg-linear-to-b from-black/65 via-transparent to-black/90" />

      <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="flex flex-col items-start gap-1.5">
          <span className="hud-label text-white/75">#{String(goal.n).padStart(2, "0")}</span>
          {video.demo && (
            <span className="hud-label border border-white/35 px-1.5 py-0.5 text-[9px] text-white/80">{dict.goals.demoTag}</span>
          )}
        </span>
        <span className="font-display text-2xl leading-none font-bold tracking-[-0.04em] sm:text-3xl">{goal.minute}</span>
      </span>

      {!active && (
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-black/45 opacity-0 ring-1 ring-white/40 transition-[opacity,transform,background-color] duration-200 group-hover:scale-100 group-hover:bg-garnet group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Play className="ml-0.5 h-5 w-5" />
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3 md:p-4">
        <span className="hud-label text-white/60">{fmtDate(goal.date)}</span>
        <span className="font-display text-base leading-tight font-medium tracking-[-0.02em] sm:text-lg md:text-xl">
          {goalTitle(goal)}
        </span>
        <span className="text-[13px] text-white/70">{goal.score}</span>
        {/* Plain text flow, so on a narrow card it wraps between words, not into two stacked columns. */}
        <span className="mt-1 text-[12px] leading-snug text-white/75">
          <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: tone(goal) }} />
          {penalty ? dict.goals.type.Penalty : (bodyLabel(goal, dict) ?? typeLabel(goal, dict))}
          <span className="text-white/40"> · </span>
          {competitionLabel(goal.competition, dict)}
        </span>
      </span>
    </button>
  );
}
