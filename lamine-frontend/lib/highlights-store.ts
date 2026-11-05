import { BUNDLED_HIGHLIGHTS, buildHighlights } from "@/lib/highlights";
import { isRawHighlight } from "@/lib/notion/highlight-schema";
import { createNotionStore } from "@/lib/notion-store";

// The highlight videos for the whole site, loaded from Notion through /api/highlights
// and kept in localStorage ("lamine-highlights") for a day. Before that, the videos
// bundled from data/lamine_yamal_highlights.json. How it works: lib/notion-store.ts.
export const useHighlightsStore = createNotionStore({
  endpoint: "/api/highlights",
  field: "highlights",
  storageKey: "lamine-highlights",
  isRaw: isRawHighlight,
  build: buildHighlights,
  bundled: BUNDLED_HIGHLIGHTS,
});

// The highlights to show, in their featured order.
export const useHighlights = () => useHighlightsStore((s) => s.items);
