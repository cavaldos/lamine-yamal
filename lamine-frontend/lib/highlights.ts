import { fold } from "@/lib/goals";
import { HIGHLIGHTS, videoTitle, type Video } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

// Search, filter and sort for the /highlights page.

// "5:27" → 327, "1:02:03" → 3723.
export const lengthSeconds = (v: Video) =>
  (v.length ?? "0").split(":").reduce((total, part) => total * 60 + Number(part), 0);

// Value of the "all sources" option. Its label is dict.common.all.
export const ALL_SOURCES = "all";
export const SOURCES = [ALL_SOURCES, ...Array.from(new Set(HIGHLIGHTS.map((v) => v.source)))];

export const sourceLabels = (d: Dictionary) => SOURCES.map((s) => (s === ALL_SOURCES ? d.common.all : s));

// [id, compare]; the id picks the label in dict.highlightsPage.sorts. The first keeps the order of lib/content.ts.
export const SORTS: [id: keyof Dictionary["highlightsPage"]["sorts"], compare: (a: Video, b: Video) => number][] = [
  ["featured", () => 0],
  ["longest", (a, b) => lengthSeconds(b) - lengthSeconds(a)],
  ["shortest", (a, b) => lengthSeconds(a) - lengthSeconds(b)],
];

export const sortLabels = (d: Dictionary) => SORTS.map(([id]) => d.highlightsPage.sorts[id]);

export type HighlightQuery = { q: string; source: number; sort: number };

export const EMPTY_QUERY: HighlightQuery = { q: "", source: 0, sort: 0 };

// The title in the page's language, the original one and the channel. Built once per dictionary.
const haystacks = new WeakMap<Dictionary, Map<string, string>>();

function haystackFor(d: Dictionary) {
  let map = haystacks.get(d);
  if (!map) {
    map = new Map(HIGHLIGHTS.map((v) => [v.youtube, fold(`${videoTitle(v, d)} ${v.title} ${v.source}`)]));
    haystacks.set(d, map);
  }
  return map;
}

export function queryHighlights(f: HighlightQuery, d: Dictionary) {
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  const hay = haystackFor(d);
  return HIGHLIGHTS.filter(
    (v) => (f.source === 0 || v.source === SOURCES[f.source]) && words.every((w) => hay.get(v.youtube)!.includes(w)),
  ).sort(SORTS[f.sort][1]);
}
