import { openVideo } from "@/components/ui/video-lightbox";
import { goalVideo, goalTitle, type Goal } from "@/lib/goals";

// Plays a goal's clip in the shared lightbox, trimmed to its start/end.
export function playGoal(goal: Goal) {
  const v = goalVideo(goal);
  openVideo({
    youtube: v.id,
    start: v.start,
    end: v.end,
    vertical: v.vertical,
    title: `Bàn #${goal.n} ${goalTitle(goal)} · ${goal.minute}${v.demo ? " (video demo)" : ""}`,
    source: goal.competition,
  });
}
