"use client";

import CountUp from "@/components/ui/count-up";
import { seasonsOf } from "@/lib/goals";
import { useGoals } from "@/lib/goals-store";

export type GoalCountOf = "goals" | "barcelona" | "spain" | "seasons";

// A goal total that follows the live list (Notion, or the bundled copy before it loads),
// so server components can show it.
export default function GoalCount({ of = "goals", delay }: { of?: GoalCountOf; delay?: number }) {
  const goals = useGoals();
  const n =
    of === "goals"
      ? goals.length
      : of === "seasons"
        ? seasonsOf(goals).length - 1
        : goals.filter((g) => g.team === (of === "barcelona" ? "Barcelona" : "Spain")).length;
  return <CountUp to={n} delay={delay} />;
}
