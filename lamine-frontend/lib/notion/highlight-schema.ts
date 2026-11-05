import type { PageObjectResponse } from "@notionhq/client";
import { formatClipRange, parseClipRange } from "../timecode.ts";
import { parseYouTube } from "../youtube.ts";
import {
  orNull,
  readNumber,
  readSelect,
  readText,
  readTitle,
  readUrl,
  select,
  text,
  title,
  type ColumnType,
  type Properties,
} from "./props.ts";

// How a highlight video is stored in the Notion database, one row per video.
// Shared by the API route (Notion → app) and scripts/notion-sync.mts (JSON → Notion),
// so it stays plain TypeScript with relative imports: Node runs the script directly.
// Same design as ./goal-schema.ts.

// Languages a title can be translated into. English is `title` itself.
export const TITLE_LANGS = ["vi", "fr", "es"] as const;
export type TitleLang = (typeof TITLE_LANGS)[number];

// One highlight as written in data/lamine_yamal_highlights.json.
export type RawHighlight = {
  youtube: string; // any YouTube link, or a bare 11-character id
  title: string; // English
  titles?: Partial<Record<TitleLang, string>>; // other languages; missing ones fall back to English
  source: string; // channel that published it
  length?: string | null; // "5:27"; worked out from the clip when empty
  order?: number | null; // position in the default ("featured") sort; empty sorts last
  start?: number; // seconds into the video; Notion keeps both in "Clip Time"
  end?: number;
};

// Column names in Notion. The title column (the English title) keeps whatever
// name the database gives it.
export const COLUMNS = {
  key: "Highlight ID",
  youtube: "YouTube",
  source: "Source",
  length: "Length",
  order: "Order",
  // The part of the video to play, typed as "06:43, 7:34" or "1:02:30, 1:03:10".
  clip: "Clip Time",
  titles: { vi: "Title (vi)", fr: "Title (fr)", es: "Title (es)" } satisfies Record<TitleLang, string>,
} as const;

// Column → Notion property type. Select options are created on first use.
export const COLUMN_TYPES: Record<string, ColumnType> = {
  [COLUMNS.key]: "rich_text",
  [COLUMNS.youtube]: "url",
  [COLUMNS.source]: "select",
  [COLUMNS.length]: "rich_text",
  [COLUMNS.order]: "number",
  [COLUMNS.clip]: "rich_text",
  ...Object.fromEntries(TITLE_LANGS.map((l) => [COLUMNS.titles[l], "rich_text" as const])),
};

// Stable id of a highlight: its YouTube video id. Used to find its row again on re-sync.
// A link that can't be read is kept as typed, so the row still gets an id.
export const highlightKey = (h: Pick<RawHighlight, "youtube">) => parseYouTube(h.youtube)?.id ?? h.youtube.trim();

// The minimum a row needs for the app to show it. Guards against half-filled rows
// in Notion and against stale or edited data in localStorage.
export const isRawHighlight = (v: unknown): v is RawHighlight => {
  const h = v as RawHighlight;
  return (
    !!h &&
    typeof h === "object" &&
    typeof h.youtube === "string" &&
    parseYouTube(h.youtube) !== null &&
    typeof h.title === "string" &&
    h.title.trim() !== "" &&
    typeof h.source === "string"
  );
};

// ---- JSON → Notion ----

// A bare id becomes a full link, so the URL column opens the video when clicked.
const youtubeUrl = (v: string) => (/^[\w-]{11}$/.test(v.trim()) ? `https://www.youtube.com/watch?v=${v.trim()}` : v.trim());

export function toProperties(h: RawHighlight, titleColumn: string): Properties {
  const props: Properties = {
    [titleColumn]: title(h.title),
    [COLUMNS.key]: text(highlightKey(h)),
    [COLUMNS.youtube]: { url: youtubeUrl(h.youtube) },
    [COLUMNS.source]: select(h.source),
    [COLUMNS.length]: text(h.length),
    [COLUMNS.order]: { number: h.order ?? null },
  };
  // Translations and the clip are only written when the JSON has them, so ones
  // added by hand in Notion survive a re-sync.
  for (const l of TITLE_LANGS) if (h.titles?.[l] !== undefined) props[COLUMNS.titles[l]] = text(h.titles[l]);
  if (h.start !== undefined || h.end !== undefined) props[COLUMNS.clip] = text(formatClipRange(h.start, h.end));
  return props;
}

// ---- Notion → app ----

// A row back into the JSON shape, or null when it lacks what the app needs
// (an empty row, or one added by hand without a YouTube link or a title).
export function fromPage(page: PageObjectResponse): RawHighlight | null {
  const p = page.properties;
  const clip = parseClipRange(readText(p[COLUMNS.clip]));
  const titles: RawHighlight["titles"] = {};
  for (const l of TITLE_LANGS) {
    const t = readText(p[COLUMNS.titles[l]]).trim();
    if (t) titles[l] = t;
  }
  const highlight: RawHighlight = {
    youtube: readUrl(p[COLUMNS.youtube])?.trim() ?? "",
    title: readTitle(page).trim(),
    titles,
    source: readSelect(p[COLUMNS.source]),
    length: orNull(readText(p[COLUMNS.length]).trim()),
    order: readNumber(p[COLUMNS.order]),
    start: clip?.start,
    end: clip?.end,
  };
  return isRawHighlight(highlight) ? highlight : null;
}
