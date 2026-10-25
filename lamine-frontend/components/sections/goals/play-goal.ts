import { openVideo } from "@/components/ui/video-lightbox";
import { competitionLabel, goalVideo, goalTitle, type Goal } from "@/lib/goals";
import { format } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

// Plays a goal's clip in the shared lightbox, trimmed to its start/end.
export function playGoal(goal: Goal, dict: Dictionary) {
  const v = goalVideo(goal);
  openVideo({
    youtube: v.id,
    start: v.start,
    end: v.end,
    vertical: v.vertical,
    title: `${format(dict.goals.goalNo, { n: goal.n })} ${goalTitle(goal)} · ${goal.minute}${v.demo ? dict.goals.demoVideoSuffix : ""}`,
    source: competitionLabel(goal.competition, dict),
  });
}
