import Link from "next/link";
import GoalMap from "@/components/sections/goals/goal-map";
import { Play } from "@/components/ui/icons";
import Section from "@/components/ui/section";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";

// Shot map of every goal with filters and per-goal detail.
export default async function GoalsSection() {
  const { goals } = await getDictionary();
  const locale = await getLocale();
  return (
    <Section id="goals">
      <GoalMap
        action={
          <Link
            href={localePath(locale, "/goals")}
            className="inline-flex h-9 items-center gap-2 bg-invert-bg px-3.5 font-mono text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-invert-fg uppercase transition-opacity duration-150 hover:opacity-80"
          >
            <Play className="h-3 w-3" /> {goals.allGoalVideos}
          </Link>
        }
      />
      <p className="hud-label border-t border-line px-6 py-3 text-faint md:px-10">
        {goals.footnote}
      </p>
    </Section>
  );
}
