import type { PageObjectResponse } from "@notionhq/client";
import { formatClipRange, parseClipRange } from "../timecode.ts";
import {
  orNull,
  readCheckbox,
  readSelect,
  readText,
  readUrl,
  select,
  text,
  title,
  type ColumnType,
  type Properties,
} from "./props.ts";

// How a goal is stored in the Notion database, one row per goal.
// Shared by the API route (Notion → app) and scripts/notion-sync.mts (JSON → Notion),
// so it stays plain TypeScript with relative imports: Node runs the script directly.

// One goal as written in data/lamine_yamal_goals_assists.json.
export type RawGoal = {
  date: string; // YYYY-MM-DD
  competition: string;
  stage: string | null;
  is_friendly: boolean;
  team: string;
  venue: string;
  home_away: string; // "home" | "away"
  opponent: string;
  match_score: string;
  type: string;
  minute: string; // "45'+2'"
  goal_type: string | null;
  assisted_by: string | null;
  goal_scorer: string;
  description: string;
  espn_event_id: string;
  youtube?: string | null;
  start?: number; // seconds into the video; Notion keeps both in "Clip Time"
  end?: number;
};

// Column names in Notion. The title column keeps whatever name the database gives it.
export const COLUMNS = {
  key: "Goal ID",
  date: "Date",
  competition: "Competition",
  stage: "Stage",
  friendly: "Friendly",
  team: "Team",
  opponent: "Opponent",
  homeAway: "Home/Away",
  venue: "Venue",
  score: "Score",
  minute: "Minute",
  goalType: "Goal Type",
  assist: "Assist",
  scorer: "Scorer",
  description: "Description",
  espnId: "ESPN Event ID",
  youtube: "YouTube",
  // The part of the video to play, typed as "06:43, 7:34" or "1:02:30, 1:03:10".
  clip: "Clip Time",
} as const;

// Column → Notion property type. Select options are created on first use.
export const COLUMN_TYPES: Record<string, ColumnType> = {
  [COLUMNS.key]: "rich_text",
  [COLUMNS.date]: "date",
  [COLUMNS.competition]: "select",
  [COLUMNS.stage]: "rich_text",
  [COLUMNS.friendly]: "checkbox",
  [COLUMNS.team]: "select",
  [COLUMNS.opponent]: "rich_text",
  [COLUMNS.homeAway]: "select",
  [COLUMNS.venue]: "rich_text",
  [COLUMNS.score]: "rich_text",
  [COLUMNS.minute]: "rich_text",
  [COLUMNS.goalType]: "select",
  [COLUMNS.assist]: "rich_text",
  [COLUMNS.scorer]: "rich_text",
  [COLUMNS.description]: "rich_text",
  [COLUMNS.espnId]: "rich_text",
  [COLUMNS.youtube]: "url",
  [COLUMNS.clip]: "rich_text",
};

// "45'+2'" → 47.
export const minuteValue = (m: string) => {
  const a = m.match(/(\d+)'(?:\+(\d+)')?/);
  return a ? Number(a[1]) + Number(a[2] ?? 0) : 0;
};

// Stable id of a goal: the match plus the minute. Used to find a goal's row again on re-sync.
export const goalKey = (g: Pick<RawGoal, "espn_event_id" | "minute">) => `${g.espn_event_id}-${minuteValue(g.minute)}`;

// The minimum a row needs for the app to show it. Guards against half-filled rows
// in Notion and against stale or edited data in localStorage.
export const isRawGoal = (v: unknown): v is RawGoal => {
  const g = v as RawGoal;
  return (
    !!g &&
    typeof g === "object" &&
    /^\d{4}-\d{2}-\d{2}$/.test(g.date) &&
    typeof g.minute === "string" &&
    typeof g.espn_event_id === "string" &&
    typeof g.team === "string" &&
    typeof g.opponent === "string" &&
    typeof g.competition === "string" &&
    typeof g.description === "string"
  );
};

// ---- JSON → Notion ----

export function toProperties(g: RawGoal, titleColumn: string): Properties {
  const props: Properties = {
    [titleColumn]: title(`${g.team} vs ${g.opponent} · ${g.minute}`),
    [COLUMNS.key]: text(goalKey(g)),
    [COLUMNS.date]: { date: { start: g.date } },
    [COLUMNS.competition]: select(g.competition),
    [COLUMNS.stage]: text(g.stage?.replace(/;\s*$/, "")),
    [COLUMNS.friendly]: { checkbox: g.is_friendly },
    [COLUMNS.team]: select(g.team),
    [COLUMNS.opponent]: text(g.opponent),
    [COLUMNS.homeAway]: select(g.home_away),
    [COLUMNS.venue]: text(g.venue),
    [COLUMNS.score]: text(g.match_score),
    [COLUMNS.minute]: text(g.minute),
    [COLUMNS.goalType]: select(g.goal_type),
    [COLUMNS.assist]: text(g.assisted_by),
    [COLUMNS.scorer]: text(g.goal_scorer),
    [COLUMNS.description]: text(g.description),
    [COLUMNS.espnId]: text(g.espn_event_id),
  };
  // Clip columns are only written when the JSON has them, so clips added
  // by hand in Notion survive a re-sync.
  if (g.youtube !== undefined) props[COLUMNS.youtube] = { url: g.youtube || null };
  if (g.start !== undefined || g.end !== undefined) props[COLUMNS.clip] = text(formatClipRange(g.start, g.end));
  return props;
}

// ---- Notion → app ----

// A row back into the JSON shape, or null when it lacks what the app needs
// (an empty row, or one added by hand without a date).
export function fromPage(page: PageObjectResponse): RawGoal | null {
  const p = page.properties;
  const when = p[COLUMNS.date];
  const date = when?.type === "date" ? when.date?.start.slice(0, 10) : undefined;
  const clip = parseClipRange(readText(p[COLUMNS.clip]));
  const goal: RawGoal = {
    date: date ?? "",
    competition: readSelect(p[COLUMNS.competition]),
    stage: orNull(readText(p[COLUMNS.stage])),
    is_friendly: readCheckbox(p[COLUMNS.friendly]),
    team: readSelect(p[COLUMNS.team]),
    venue: readText(p[COLUMNS.venue]),
    home_away: readSelect(p[COLUMNS.homeAway]) || "home",
    opponent: readText(p[COLUMNS.opponent]),
    match_score: readText(p[COLUMNS.score]),
    type: "goal",
    minute: readText(p[COLUMNS.minute]),
    goal_type: orNull(readSelect(p[COLUMNS.goalType])),
    assisted_by: orNull(readText(p[COLUMNS.assist])),
    goal_scorer: readText(p[COLUMNS.scorer]) || "Lamine Yamal",
    description: readText(p[COLUMNS.description]),
    espn_event_id: readText(p[COLUMNS.espnId]) || page.id,
    youtube: readUrl(p[COLUMNS.youtube]),
    start: clip?.start,
    end: clip?.end,
  };
  return goal.date && goal.minute && goal.opponent && goal.team ? goal : null;
}
