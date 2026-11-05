import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// A list loaded from one of the site's Notion databases through its API route
// (/api/goals, /api/highlights), shared by lib/goals-store.ts and lib/highlights-store.ts.
//
// The Notion copy is kept in localStorage, so a visitor calls the API at most once
// per MAX_AGE; every other page load reads it from storage. Until the first answer
// arrives (or when Notion is down or not set up yet) the site shows the copy
// bundled from data/.
//
// Storage is read after hydration (<NotionSync /> in the layout), so the first
// client render matches the server's HTML.

export const MAX_AGE = 24 * 60 * 60 * 1000; // a day

export type NotionListState<Raw, Item> = {
  raw: Raw[] | null; // the Notion copy; null until one has been loaded
  fetchedAt: number; // when `raw` was loaded, ms since epoch; 0 = never
  items: Item[]; // what components show: the Notion copy, else the bundled one
  status: "idle" | "loading" | "error";
  error: string | null;
  // Fetches from Notion when the stored copy is missing or older than MAX_AGE.
  // `force` skips that check (e.g. a "refresh" button).
  load: (options?: { force?: boolean }) => Promise<void>;
};

export function createNotionStore<Raw, Item>(o: {
  endpoint: string; // "/api/goals"
  field: string; // the list's name in the response body: "goals"
  storageKey: string; // localStorage key
  isRaw: (v: unknown) => v is Raw;
  build: (raw: Raw[]) => Item[];
  bundled: Item[];
}) {
  type State = NotionListState<Raw, Item>;
  type Saved = Pick<State, "raw" | "fetchedAt">;

  return create<State>()(
    persist(
      (set, get) => ({
        raw: null,
        fetchedAt: 0,
        items: o.bundled,
        status: "idle",
        error: null,

        load: async ({ force = false } = {}) => {
          const { raw, fetchedAt, status } = get();
          if (status === "loading") return;
          if (!force && raw && Date.now() - fetchedAt < MAX_AGE) return;

          set({ status: "loading", error: null });
          try {
            const res = await fetch(o.endpoint, { cache: "no-store" });
            const body: Record<string, unknown> | null = await res.json().catch(() => null);
            const list = body?.[o.field];
            if (!res.ok || !Array.isArray(list)) throw new Error(String(body?.error ?? `HTTP ${res.status}`));
            const fresh = list.filter(o.isRaw);
            // An empty database (not synced yet) shouldn't blank the site.
            if (!fresh.length) throw new Error(`The Notion database has no ${o.field} yet`);
            set({ raw: fresh, fetchedAt: Date.now(), items: o.build(fresh), status: "idle" });
          } catch (e) {
            // Keep showing what we have (stored or bundled items).
            set({ status: "error", error: e instanceof Error ? e.message : String(e) });
          }
        },
      }),
      {
        name: o.storageKey,
        version: 1,
        // No storage on the server. Throwing here makes zustand skip it, instead of
        // touching Node's own experimental localStorage.
        storage: createJSONStorage(() => {
          if (typeof window === "undefined") throw new Error("no localStorage on the server");
          return window.localStorage;
        }),
        skipHydration: true,
        // Only the raw Notion copy is stored; the parsed items are rebuilt on load.
        partialize: (s): Saved => ({ raw: s.raw, fetchedAt: s.fetchedAt }),
        merge: (saved, current) => {
          const s = saved as Partial<Saved> | undefined;
          const raw = Array.isArray(s?.raw) ? s.raw.filter(o.isRaw) : [];
          if (!raw.length) return current;
          return { ...current, raw, fetchedAt: Number(s?.fetchedAt) || 0, items: o.build(raw) };
        },
      },
    ),
  );
}
