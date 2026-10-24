import { Play } from "@/components/ui/icons";
import Poster from "@/components/goals-page/poster";
import { BODY_VI, fmtDate, goalTitle, goalVideo, tone, TYPE_VI, type Goal } from "@/lib/goals";

// One goal in the grid: a 9:16 poster, like a short-video feed.
export default function GoalCard({ goal, onOpen }: { goal: Goal; onOpen: () => void }) {
  const video = goalVideo(goal);
  const penalty = goal.type === "Penalty";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Xem bàn #${goal.n} ${goalTitle(goal)}, phút ${goal.minute}`}
      className="thumb-zoom group relative block aspect-[9/16] w-full overflow-hidden bg-bg-sunken text-left text-white outline outline-line focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Poster video={video} className="absolute inset-0 h-full w-full object-cover" />
      <span aria-hidden className="absolute inset-0 bg-linear-to-b from-black/65 via-transparent to-black/90" />

      <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="flex flex-col items-start gap-1.5">
          <span className="hud-label text-white/75">#{String(goal.n).padStart(2, "0")}</span>
          {video.demo && (
            <span className="hud-label border border-white/35 px-1.5 py-0.5 text-[9px] text-white/80">Demo</span>
          )}
        </span>
        <span className="font-display text-3xl leading-none font-bold tracking-[-0.04em]">{goal.minute}</span>
      </span>

      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-black/45 opacity-0 ring-1 ring-white/40 transition-[opacity,transform,background-color] duration-200 group-hover:scale-100 group-hover:bg-garnet group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Play className="ml-0.5 h-5 w-5" />
      </span>

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3 md:p-4">
        <span className="hud-label text-white/60">{fmtDate(goal.date)}</span>
        <span className="font-display text-lg leading-tight font-medium tracking-[-0.02em] md:text-xl">
          {goalTitle(goal)}
        </span>
        <span className="text-[13px] text-white/70">{goal.score}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[12px] text-white/75">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone(goal) }} />
          {penalty ? "Penalty" : goal.body ? (BODY_VI[goal.body] ?? goal.body) : TYPE_VI[goal.type]}
          <span className="text-white/40">·</span>
          {goal.competition}
        </span>
      </span>
    </button>
  );
}
