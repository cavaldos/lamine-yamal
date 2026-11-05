import { BUNDLED_GOALS, buildGoals } from "@/lib/goals";
import { isRawGoal } from "@/lib/notion/goal-schema";
import { createNotionStore } from "@/lib/notion-store";

export { MAX_AGE } from "@/lib/notion-store";

// The goal list for the whole site, loaded from Notion through /api/goals and kept
// in localStorage ("lamine-goals") for a day. Before that, the goals bundled from
// data/lamine_yamal_goals_assists.json. How it works: lib/notion-store.ts.
export const useGoalsStore = createNotionStore({
  endpoint: "/api/goals",
  field: "goals",
  storageKey: "lamine-goals",
  isRaw: isRawGoal,
  build: buildGoals,
  bundled: BUNDLED_GOALS,
});

// The goals to show, in date order (goal #1 first).
export const useGoals = () => useGoalsStore((s) => s.items);
