import Link from "next/link";
import { ArrowUpRight, Play } from "@/components/ui/icons";
import MorphText from "@/components/ui/morph-text";
import { playGoal } from "@/components/sections/goals/play-goal";
import { bodyLabel, competitionLabel, fmtDate, typeLabel, type Goal } from "@/lib/goals";
import { format, localePath } from "@/lib/i18n/config";
import { useDict, useLocale } from "@/lib/i18n/provider";

// Everything about one goal, plus ways to watch it: in place, or in the
// /goals feed. Goals without their own clip yet play a demo.
export default function GoalDetail({ goal }: { goal: Goal }) {
  const dict = useDict();
  const locale = useLocale();
  const t = dict.goals;
  const facts: [string, string][] = [
    [t.foot, bodyLabel(goal, dict) ?? "—"],
    [t.situation, typeLabel(goal, dict)],
    ["xG", goal.shot ? goal.shot.xg.toFixed(2) : "—"],
    [t.distance, goal.shot ? `${goal.shot.distance}m` : "—"],
  ];

  return (
    // Not keyed: each field morphs into the next goal's value in place.
    <article className="border-b border-line px-6 py-6 md:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="hud-label text-garnet-ink">
            <MorphText
              value={`${format(t.goalNo, { n: goal.n })} · ${fmtDate(goal.date)} · ${competitionLabel(goal.competition, dict)}`}
            />
          </p>
          <h3 className="mt-2 font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong">
            <MorphText value={`${goal.home ? "vs" : "@"} ${goal.opponent}`} />
          </h3>
          <p className="mt-1 text-muted">
            <MorphText value={goal.score} />
          </p>
        </div>
        <p className="shrink-0 font-display text-5xl leading-none font-bold tracking-[-0.04em]">
          <MorphText value={goal.minute} className="text-blaugrana text-right" />
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="hud-label text-faint">{k}</dt>
            <dd className="mt-1 text-ink">
              <MorphText value={v} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted">
        {t.assistLabel}{" "}
        <span className="inline-block align-bottom text-ink">
          <MorphText value={goal.assist ?? "—"} />
        </span>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => playGoal(goal, dict)}
          className="inline-flex h-10 items-center gap-2 bg-invert-bg px-4 font-mono text-[11px] font-bold tracking-[0.12em] text-invert-fg uppercase transition-opacity hover:opacity-80"
        >
          <Play className="h-3.5 w-3.5" /> {t.watchGoal}
        </button>
        <Link
          href={`${localePath(locale, "/goals")}#goal-${goal.n}`}
          className="invert-block inline-flex h-10 items-center gap-2 border border-line-strong px-4 font-mono text-[11px] font-bold tracking-[0.12em] text-ink uppercase hover:border-transparent"
        >
          {t.openInLibrary} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
