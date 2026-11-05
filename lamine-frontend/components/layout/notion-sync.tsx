"use client";

import { useEffect } from "react";
import { useGoalsStore } from "@/lib/goals-store";
import { useHighlightsStore } from "@/lib/highlights-store";

// Loads the Notion-backed lists (goals, highlights) once per page load: first the
// copy saved in localStorage, then Notion (via /api/…) only if that copy is missing
// or more than a day old. Runs after hydration so the first render matches the
// server's HTML.
export default function NotionSync() {
  useEffect(() => {
    for (const store of [useGoalsStore, useHighlightsStore]) {
      Promise.resolve(store.persist.rehydrate()).then(() => store.getState().load());
    }
  }, []);
  return null;
}
