"use client";

import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import GoalFeed from "@/components/goals-page/goal-feed";
import GoalFilm from "@/components/goals-page/goal-film";
import GoalShotMap from "@/components/goals-page/goal-shot-map";
import GoalGrid from "@/components/goals-page/goal-grid";
import GoalToolbar, { type ViewMode } from "@/components/goals-page/goal-toolbar";
import { ALL_GOALS, EMPTY_QUERY, queryGoals, SORTS, type Goal, type GoalQuery } from "@/lib/goals";

// The chosen viewing mode, remembered in localStorage. Read through
// useSyncExternalStore so the server render and hydration agree on the default.
const MODE_KEY = "lamine-goal-mode";
const modeListeners = new Set<() => void>();
let fallbackMode: ViewMode | null = null; // used when storage is blocked
const readMode = (): ViewMode => {
  if (fallbackMode) return fallbackMode;
  try {
    return localStorage.getItem(MODE_KEY) === "film" ? "film" : "feed";
  } catch {
    return "feed";
  }
};
const subscribeMode = (fn: () => void) => {
  modeListeners.add(fn);
  return () => {
    modeListeners.delete(fn);
  };
};
const saveMode = (m: ViewMode) => {
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {
    fallbackMode = m;
  }
  modeListeners.forEach((fn) => fn());
};

type Open = { mode: ViewMode; goals: Goal[]; index: number } | null;

// The interactive part of /goals: toolbar, grid, and the two players.
// Clicking a card opens the chosen mode at that goal, over the filtered list.
export default function GoalBrowser() {
  const [query, setQuery] = useState<GoalQuery>(EMPTY_QUERY);
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "feed" as const);
  const [open, setOpen] = useState<Open>(null);
  const goals = useMemo(() => queryGoals(query), [query]);

  // Links like /goals#goal-12 open that goal, once the page has hydrated.
  useEffect(() => {
    const n = Number(window.location.hash.match(/^#goal-(\d+)$/)?.[1]);
    const all = queryGoals(EMPTY_QUERY);
    const at = all.findIndex((g) => g.n === n);
    // The URL can only be read after hydration, so this state is set from an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (at >= 0) setOpen({ mode: "feed", goals: all, index: at });
  }, []);

  // Next.js keeps this page alive (hidden) after navigating away; close any
  // player then, so coming back shows the grid, not a stale modal.
  useLayoutEffect(() => () => setOpen(null), []);

  const close = () => {
    setOpen(null);
    if (window.location.hash) history.replaceState(history.state, "", window.location.pathname);
  };

  return (
    <>
      <GoalToolbar
        query={query}
        onQuery={setQuery}
        count={goals.length}
        total={ALL_GOALS.length}
        mode={mode}
        onMode={saveMode}
        onPlayAll={() => setOpen({ mode, goals, index: 0 })}
      />

      <GoalShotMap
        goals={goals}
        onPlay={(g) => setOpen({ mode, goals, index: goals.findIndex((x) => x.id === g.id) })}
      />

      {goals.length > 0 ? (
        <GoalGrid goals={goals} bySeason={SORTS[query.sort][2]} onOpen={(index) => setOpen({ mode, goals, index })} />
      ) : (
        <div className="px-6 py-24 text-center md:px-10">
          <p className="font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong">Không có bàn nào khớp.</p>
          <p className="mt-3 text-muted">Thử từ khoá khác, hoặc bỏ bớt bộ lọc.</p>
          <button
            type="button"
            onClick={() => setQuery({ ...EMPTY_QUERY, sort: query.sort })}
            className="hud-label mt-6 border border-line-strong px-4 py-2.5 text-ink hover:bg-invert-bg hover:text-invert-fg"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}

      {/* Keyed so each opening starts fresh. The list is frozen while open. */}
      {open?.mode === "feed" && (
        <GoalFeed
          key={`feed-${open.index}`}
          goals={open.goals}
          start={open.index}
          onClose={close}
          onFilm={(index) => setOpen({ mode: "film", goals: open.goals, index })}
        />
      )}
      {open?.mode === "film" && (
        <GoalFilm key={`film-${open.index}`} goals={open.goals} start={open.index} onClose={close} />
      )}
    </>
  );
}
