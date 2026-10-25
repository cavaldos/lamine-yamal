import type { CreatePageParameters, PageObjectResponse } from "@notionhq/client";

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
  start?: number;
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
  start: "Clip Start",
  end: "Clip End",
} as const;

// Column → Notion property type. Select options are created on first use.
export const COLUMN_TYPES: Record<string, "rich_text" | "date" | "select" | "checkbox" | "url" | "number"> = {
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
  [COLUMNS.start]: "number",
  [COLUMNS.end]: "number",
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

type Properties = NonNullable<CreatePageParameters["properties"]>;

// Notion caps one rich text item at 2000 characters.
const text = (s: string | null | undefined) => ({
  rich_text: s ? [{ type: "text" as const, text: { content: s.slice(0, 2000) } }] : [],
});
const select = (s: string | null | undefined) => ({ select: s ? { name: s.replace(/,/g, " ") } : null });

export function toProperties(g: RawGoal, titleColumn: string): Properties {
  const props: Properties = {
    [titleColumn]: { title: [{ type: "text", text: { content: `${g.team} vs ${g.opponent} · ${g.minute}` } }] },
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
  if (g.start !== undefined) props[COLUMNS.start] = { number: g.start };
  if (g.end !== undefined) props[COLUMNS.end] = { number: g.end };
  return props;
}

// ---- Notion → app ----

type Prop = PageObjectResponse["properties"][string];

const readText = (p: Prop | undefined) =>
  p?.type === "rich_text"
    ? p.rich_text.map((t) => t.plain_text).join("")
    : p?.type === "title"
      ? p.title.map((t) => t.plain_text).join("")
      : "";
const readSelect = (p: Prop | undefined) => (p?.type === "select" ? (p.select?.name ?? "") : "");
const orNull = (s: string) => s || null;

// A row back into the JSON shape, or null when it lacks what the app needs
// (an empty row, or one added by hand without a date).
export function fromPage(page: PageObjectResponse): RawGoal | null {
  const p = page.properties;
  const when = p[COLUMNS.date];
  const date = when?.type === "date" ? when.date?.start.slice(0, 10) : undefined;
  const friendly = p[COLUMNS.friendly];
  const youtube = p[COLUMNS.youtube];
  const start = p[COLUMNS.start];
  const end = p[COLUMNS.end];
  const goal: RawGoal = {
    date: date ?? "",
    competition: readSelect(p[COLUMNS.competition]),
    stage: orNull(readText(p[COLUMNS.stage])),
    is_friendly: friendly?.type === "checkbox" ? friendly.checkbox : false,
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
    youtube: youtube?.type === "url" ? youtube.url : null,
    start: start?.type === "number" ? (start.number ?? undefined) : undefined,
    end: end?.type === "number" ? (end.number ?? undefined) : undefined,
  };
  return goal.date && goal.minute && goal.opponent && goal.team ? goal : null;
}
