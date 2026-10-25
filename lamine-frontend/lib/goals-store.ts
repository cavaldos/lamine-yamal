import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BUNDLED_GOALS, buildGoals, type Goal } from "@/lib/goals";
import { isRawGoal, type RawGoal } from "@/lib/notion/goal-schema";

// The goal list for the whole site, loaded from Notion through /api/goals.
//
// The Notion copy is kept in localStorage ("lamine-goals"), so a visitor calls the
// API at most once per MAX_AGE; every other page load reads it from storage.
// Until the first answer arrives (or when Notion is down or not set up yet) the
// site shows the goals bundled from data/lamine_yamal_goals_assists.json.
//
// Storage is read after hydration (<GoalsSync /> in the layout), so the first
// client render matches the server's HTML.

export const MAX_AGE = 24 * 60 * 60 * 1000; // a day
const STORAGE_KEY = "lamine-goals";

type GoalsState = {
  raw: RawGoal[] | null; // the Notion copy; null until one has been loaded
  fetchedAt: number; // when `raw` was loaded, ms since epoch; 0 = never
  goals: Goal[]; // what components show: the Notion copy, else the bundled one
  status: "idle" | "loading" | "error";
  error: string | null;
  // Fetches from Notion when the stored copy is missing or older than MAX_AGE.
  // `force` skips that check (e.g. a "refresh" button).
  load: (options?: { force?: boolean }) => Promise<void>;
};

type Saved = Pick<GoalsState, "raw" | "fetchedAt">;

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      raw: null,
      fetchedAt: 0,
      goals: BUNDLED_GOALS,
      status: "idle",
      error: null,

      load: async ({ force = false } = {}) => {
        const { raw, fetchedAt, status } = get();
        if (status === "loading") return;
        if (!force && raw && Date.now() - fetchedAt < MAX_AGE) return;

        set({ status: "loading", error: null });
        try {
          const res = await fetch("/api/goals", { cache: "no-store" });
          const body: { goals?: unknown[]; error?: string } | null = await res.json().catch(() => null);
          if (!res.ok || !Array.isArray(body?.goals)) throw new Error(body?.error ?? `HTTP ${res.status}`);
          const fresh = body.goals.filter(isRawGoal);
          // An empty database (not synced yet) shouldn't blank the site.
          if (!fresh.length) throw new Error("The Notion database has no goals yet");
          set({ raw: fresh, fetchedAt: Date.now(), goals: buildGoals(fresh), status: "idle" });
        } catch (e) {
          // Keep showing what we have (stored or bundled goals).
          set({ status: "error", error: e instanceof Error ? e.message : String(e) });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // No storage on the server. Throwing here makes zustand skip it, instead of
      // touching Node's own experimental localStorage.
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") throw new Error("no localStorage on the server");
        return window.localStorage;
      }),
      skipHydration: true,
      // Only the raw Notion copy is stored; the parsed goals are rebuilt on load.
      partialize: (s): Saved => ({ raw: s.raw, fetchedAt: s.fetchedAt }),
      merge: (saved, current) => {
        const s = saved as Partial<Saved> | undefined;
        const raw = Array.isArray(s?.raw) ? s.raw.filter(isRawGoal) : [];
        if (!raw.length) return current;
        return { ...current, raw, fetchedAt: Number(s?.fetchedAt) || 0, goals: buildGoals(raw) };
      },
    },
  ),
);

// The goals to show, in date order (goal #1 first).
export const useGoals = () => useGoalsStore((s) => s.goals);
