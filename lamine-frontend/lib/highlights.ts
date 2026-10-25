import { fold } from "@/lib/goals";
import { HIGHLIGHTS, type Video } from "@/lib/content";

// Search, filter and sort for the /highlights page.

// "5:27" → 327, "1:02:03" → 3723.
export const lengthSeconds = (v: Video) =>
  (v.length ?? "0").split(":").reduce((total, part) => total * 60 + Number(part), 0);

export const fmtMinutes = (s: number) => `${Math.round(s / 60)} phút`;

export const ALL_SOURCES = "Tất cả";
export const SOURCES = [ALL_SOURCES, ...Array.from(new Set(HIGHLIGHTS.map((v) => v.source)))];

// [label, compare]. The first keeps the order of lib/content.ts.
export const SORTS: [string, (a: Video, b: Video) => number][] = [
  ["Nổi bật", () => 0],
  ["Dài nhất", (a, b) => lengthSeconds(b) - lengthSeconds(a)],
  ["Ngắn nhất", (a, b) => lengthSeconds(a) - lengthSeconds(b)],
];

export type HighlightQuery = { q: string; source: number; sort: number };

export const EMPTY_QUERY: HighlightQuery = { q: "", source: 0, sort: 0 };

const HAYSTACK = new Map(HIGHLIGHTS.map((v) => [v.youtube, fold(`${v.title} ${v.source}`)]));

export function queryHighlights(f: HighlightQuery) {
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  return HIGHLIGHTS.filter(
    (v) =>
      (f.source === 0 || v.source === SOURCES[f.source]) && words.every((w) => HAYSTACK.get(v.youtube)!.includes(w)),
  ).sort(SORTS[f.sort][1]);
}
