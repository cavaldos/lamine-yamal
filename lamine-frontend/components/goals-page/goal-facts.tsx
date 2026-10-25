import { bodyLabel, competitionLabel, fmtDate, goalTitle, typeLabel, type Goal } from "@/lib/goals";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";

// Who, when and how, laid over a playing clip. Always white: it sits on video.
export default function GoalFacts({ goal, demo, size = "md" }: { goal: Goal; demo?: boolean; size?: "md" | "lg" }) {
  const dict = useDict();
  const t = dict.goals;
  const facts = [
    goal.type === "Penalty"
      ? typeLabel(goal, dict)
      : [bodyLabel(goal, dict), typeLabel(goal, dict)].filter(Boolean).join(" · "),
    ...(goal.shot ? [`xG ${goal.shot.xg.toFixed(2)}`, `${goal.shot.distance}m`] : []),
    goal.assist ? format(t.assistBy, { name: goal.assist }) : t.noAssist,
  ];

  return (
    <div className="text-white">
      <p className="hud-label text-white/65">
        {format(t.goalNo, { n: goal.n })} · {fmtDate(goal.date)} · {competitionLabel(goal.competition, dict)}
      </p>
      <p
        className={`mt-1.5 flex items-baseline gap-3 font-display font-medium tracking-[-0.03em] ${
          size === "lg" ? "text-3xl md:text-5xl" : "text-2xl"
        }`}
      >
        <span className="min-w-0 truncate">{goalTitle(goal)}</span>
        <span className="shrink-0 font-bold text-gold">{goal.minute}</span>
      </p>
      <p className="mt-0.5 text-white/75">{goal.score}</p>
      <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-white/70">
        {facts.map((f, i) => (
          <span key={f}>
            {i > 0 && <span className="mr-2 text-white/35">·</span>}
            {f}
          </span>
        ))}
      </p>
      {demo && (
        <p className="hud-label mt-2.5 inline-block border border-white/30 px-1.5 py-0.5 text-[9px] text-white/70">
          {t.demoNotice}
        </p>
      )}
    </div>
  );
}
