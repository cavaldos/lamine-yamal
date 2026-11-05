import RAW from "@/data/lamine_yamal_highlights.json";
import { fold } from "@/lib/goals";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { highlightKey, type RawHighlight } from "@/lib/notion/highlight-schema";
import { formatTimecode } from "@/lib/timecode";
import { parseYouTube } from "@/lib/youtube";

// Highlight videos for /highlights. They come from the Notion highlights database
// (via /api/highlights, cached in localStorage by lib/highlights-store.ts);
// data/lamine_yamal_highlights.json is the bundled copy shown until then, and the
// source `npm run notion:sync -- highlights` uploads.
//
// Adding a video: add a row in Notion with its YouTube link, English title and
// source, or add it to the JSON and sync. Optional: "Title (vi/fr/es)" for other
// languages, "Order" to place it in the default sort, and "Clip Time"
// ("06:43, 7:34") to play only part of a long video.

export type Highlight = {
  id: string; // the video id; unique in the list
  n: number; // 1 = first in the featured order
  youtube: string; // 11-character video id
  title: string; // English
  titles: RawHighlight["titles"];
  source: string;
  length?: string; // "5:27"
  start?: number;
  end?: number;
};

// Raw highlights (from Notion or the JSON) → app highlights, in their featured
// order: by "Order", rows without one last, ties kept as they came.
export function buildHighlights(raw: RawHighlight[]): Highlight[] {
  const seen = new Set<string>();
  return raw
    .map((r, i) => ({ r, i, order: r.order ?? Infinity }))
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .flatMap(({ r }) => {
      const video = parseYouTube(r.youtube);
      if (!video) return [];
      // The same video twice (two clips of it) still needs distinct ids.
      let id = highlightKey(r);
      while (seen.has(id)) id += "+";
      seen.add(id);
      const start = r.start ?? video.start;
      const length = r.length || (r.end !== undefined ? formatTimecode(r.end - (start ?? 0)) : undefined);
      return [{ id, youtube: video.id, title: r.title, titles: r.titles, source: r.source, length, start, end: r.end }];
    })
    .map((h, i) => ({ ...h, n: i + 1 }));
}

// The copy shipped with the site: what the server renders, and the fallback when
// Notion can't be reached. Components read the live list with useHighlights().
export const BUNDLED_HIGHLIGHTS: Highlight[] = buildHighlights(RAW.highlights as RawHighlight[]);

// The title in the page's language, else the English one.
export const highlightTitle = (h: Highlight, locale: Locale) =>
  (locale !== "en" && h.titles?.[locale]) || h.title;

// The clip for the shared YouTube player (components/goals-page/use-goal-player.ts).
export const highlightClip = (h: Highlight) => ({
  id: h.youtube,
  vertical: false,
  start: h.start,
  end: h.end,
  demo: false,
});

// "5:27" → 327, "1:02:03" → 3723.
export const lengthSeconds = (h: Highlight) =>
  (h.length ?? "0").split(":").reduce((total, part) => total * 60 + (Number(part) || 0), 0);

// Value of the "all sources" option. Its label is dict.common.all.
export const ALL_SOURCES = "all";
// Source filter values, most videos first.
export const sourcesOf = (list: Highlight[]) => {
  const count = new Map<string, number>();
  list.forEach((h) => count.set(h.source, (count.get(h.source) ?? 0) + 1));
  return [ALL_SOURCES, ...[...count.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)];
};

export const sourceLabels = (d: Dictionary, sources: string[]) =>
  sources.map((s) => (s === ALL_SOURCES ? d.common.all : s));

export function highlightStats(list: Highlight[]) {
  const seconds = list.map(lengthSeconds);
  return {
    videos: list.length,
    sources: sourcesOf(list).length - 1,
    minutes: Math.round(seconds.reduce((a, b) => a + b, 0) / 60),
    longest: Math.round(Math.max(0, ...seconds) / 60),
  };
}

// [id, compare]; the id picks the label in dict.highlightsPage.sorts.
export const SORTS: [id: keyof Dictionary["highlightsPage"]["sorts"], compare: (a: Highlight, b: Highlight) => number][] =
  [
    ["featured", (a, b) => a.n - b.n],
    ["longest", (a, b) => lengthSeconds(b) - lengthSeconds(a) || a.n - b.n],
    ["shortest", (a, b) => lengthSeconds(a) - lengthSeconds(b) || a.n - b.n],
  ];

export const sortLabels = (d: Dictionary) => SORTS.map(([id]) => d.highlightsPage.sorts[id]);

export type HighlightQuery = { q: string; source: string; sort: number };

export const EMPTY_QUERY: HighlightQuery = { q: "", source: ALL_SOURCES, sort: 0 };

// The title in the page's language, the English one and the channel. Built once
// per highlight and language.
const haystacks = new WeakMap<Highlight, Partial<Record<Locale, string>>>();

function haystackOf(h: Highlight, locale: Locale) {
  let byLocale = haystacks.get(h);
  if (!byLocale) haystacks.set(h, (byLocale = {}));
  return (byLocale[locale] ??= fold(`${highlightTitle(h, locale)} ${h.title} ${h.source}`));
}

export function queryHighlights(list: Highlight[], f: HighlightQuery, locale: Locale) {
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  return list
    .filter(
      (h) =>
        (f.source === ALL_SOURCES || h.source === f.source) &&
        words.every((w) => haystackOf(h, locale).includes(w)),
    )
    .sort(SORTS[f.sort][1]);
}
