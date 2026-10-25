"use client";

import { useEffect } from "react";
import { useGoalsStore } from "@/lib/goals-store";

// Loads the goal list once per page load: first the copy saved in localStorage,
// then Notion (via /api/goals) only if that copy is missing or more than a day old.
// Runs after hydration so the first render matches the server's HTML.
export default function GoalsSync() {
  useEffect(() => {
    Promise.resolve(useGoalsStore.persist.rehydrate()).then(() => useGoalsStore.getState().load());
  }, []);
  return null;
}
