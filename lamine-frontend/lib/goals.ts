import SHOTS from "@/data/goals.json";
import RAW from "@/data/lamine_yamal_goals_assists.json";
import { DEMO_VIDEOS, DEMO_POOL } from "@/lib/demo-videos";
import { format } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

// Goal data. The source of truth is data/lamine_yamal_goals_assists.json (every
// goal, all competitions). data/goals.json holds shot positions and xG for the
// La Liga goals only; they are matched by date and minute, so goals from other
// competitions simply have no dot on the shot map.
//
// Adding a goal's clip: add `"youtube"` to that goal in
// data/lamine_yamal_goals_assists.json (any YouTube link or id).
//   "youtube": "https://www.youtube.com/shorts/bqgKhGNMXNo"   → plays vertical (9:16)
//   "youtube": "https://www.youtube.com/watch?v=AfpItQBKl04&t=95" → 16:9, starts at 1:35
// Optional "start" / "end" (seconds) trim a long video down to the goal, so the
// back-to-back mode moves on as soon as the goal is over.

type RawGoal = (typeof RAW.goals)[number] & { youtube?: string | null; start?: number; end?: number };

export type Shot = { x: number; y: number; xg: number; distance: number; legacyN: number };

export type Goal = {
  id: string;
  n: number; // 1 = first goal, in date order
  date: string;
  season: string;
  competition: string; // short display name
  team: string; // "Barcelona" | "Spain"
  opponent: string;
  home: boolean;
  score: string;
  minute: string;
  type: "Open Play" | "Penalty" | "Free Kick" | "Volley";
  body?: "Left Foot" | "Right Foot";
  assist: string | null;
  area?: "inside" | "outside"; // from the match report's wording, when it gives one
  shot?: Shot; // position and xG, La Liga only
  youtube?: string | null;
  start?: number;
  end?: number;
};

const COMPETITIONS: Record<string, string> = {
  "Spanish LALIGA": "La Liga",
  "UEFA Champions League": "Champions League",
  "UEFA Nations League": "Nations League",
  "Spanish Copa del Rey": "Copa del Rey",
  "Spanish Supercopa": "Supercopa",
  "UEFA European Championship Qualifying": "Euro Qualifying",
  "UEFA European Championship": "Euro",
  "FIFA World Cup": "World Cup",
  "Trofeo Joan Gamper": "Joan Gamper",
};

// "45'+2'" → 47, so minutes can be compared across sources.
const minuteValue = (m: string) => {
  const a = m.match(/(\d+)'(?:\+(\d+)')?/);
  return a ? Number(a[1]) + Number(a[2] ?? 0) : 0;
};

// The season a date belongs to: August onwards starts the next one.
const seasonOf = (date: string) => {
  const y = Number(date.slice(0, 4));
  const start = Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  return `${start}/${start + 1}`;
};

function parseGoal(r: RawGoal, n: number): Goal {
  const d = r.description;
  const kind = r.goal_type ?? "Goal";
  const type = kind.startsWith("Penalty")
    ? "Penalty"
    : kind.includes("Free-kick")
      ? "Free Kick"
      : kind.includes("Volley")
        ? "Volley"
        : "Open Play";
  const body = /left footed/.test(d) ? "Left Foot" : /right footed/.test(d) ? "Right Foot" : undefined;
  const area = /outside the box/.test(d) ? "outside" : /of the box|close range|angle/.test(d) ? "inside" : undefined;

  const shot = (
    SHOTS as { date: string; minute: string; n: number; x: number; y: number; xg: number; distance: number }[]
  ).find(
    (o) =>
      o.date === r.date &&
      r.competition === "Spanish LALIGA" &&
      Math.abs(minuteValue(o.minute) - minuteValue(r.minute)) <= 1,
  );

  return {
    id: `goal-${r.espn_event_id}-${minuteValue(r.minute)}`,
    n,
    date: r.date,
    season: seasonOf(r.date),
    competition: COMPETITIONS[r.competition] ?? r.competition,
    team: r.team,
    opponent: r.opponent,
    home: r.home_away === "home",
    score: r.match_score,
    minute: r.minute,
    type,
    body,
    assist: r.assisted_by,
    area: area ?? (shot ? (shot.distance > 16.5 ? "outside" : "inside") : undefined),
    shot: shot && { x: shot.x, y: shot.y, xg: shot.xg, distance: shot.distance, legacyN: shot.n },
    youtube: r.youtube,
    start: r.start,
    end: r.end,
  };
}

export const ALL_GOALS: Goal[] = (RAW.goals as RawGoal[])
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date) || minuteValue(a.minute) - minuteValue(b.minute))
  .map((r, i) => parseGoal(r, i + 1));

export type GoalVideo = {
  id: string;
  vertical: boolean;
  start?: number;
  end?: number;
  demo: boolean; // a stand-in from lib/demo-videos.ts, not the goal's own clip
};

// "75", "1m15s", "1h2m3s" → seconds.
const seconds = (t: string | null) => {
  if (!t) return undefined;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : undefined;
};

// Accepts a bare id or any youtube.com / youtu.be link (watch, shorts, embed, live).
export function parseYouTube(value: string) {
  const v = value.trim();
  if (/^[\w-]{11}$/.test(v)) return { id: v, vertical: false };
  try {
    const url = new URL(v.startsWith("http") ? v : `https://${v}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = url.hostname.endsWith("youtu.be")
      ? parts[0]
      : (url.searchParams.get("v") ?? (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null));
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return {
      id,
      vertical: parts[0] === "shorts",
      start: seconds(url.searchParams.get("t") ?? url.searchParams.get("start")),
    };
  } catch {
    return null;
  }
}

// The clip to play for a goal: its own link when set, otherwise a demo.
export function goalVideo(g: Goal): GoalVideo {
  const own = g.youtube ? parseYouTube(g.youtube) : null;
  if (own) return { ...own, start: g.start ?? own.start, end: g.end, demo: false };
  const entry = (g.shot && DEMO_VIDEOS[g.shot.legacyN]) || DEMO_POOL[g.n % DEMO_POOL.length];
  const { url, start, end } = typeof entry === "string" ? { url: entry, start: undefined, end: undefined } : entry;
  const demo = parseYouTube(url)!;
  return { ...demo, start: start ?? demo.start, end, demo: true };
}

export const thumb = (id: string, size: "hqdefault" | "hq720" | "oar2" = "hqdefault") =>
  `https://i.ytimg.com/vi/${id}/${size}.jpg`;

// Best poster for a clip: Shorts have a full-size vertical frame (oar2); for
// landscape clips `large` picks 1280px over the small 480px default.
export const poster = (v: GoalVideo, large = false) => thumb(v.id, v.vertical ? "oar2" : large ? "hq720" : "hqdefault");

export const watchUrl = (v: GoalVideo) =>
  v.vertical
    ? `https://www.youtube.com/shorts/${v.id}`
    : `https://www.youtube.com/watch?v=${v.id}${v.start ? `&t=${v.start}` : ""}`;

// "vs Real Madrid" at home, "@ Real Madrid" away.
export const goalTitle = (g: Goal) => `${g.home ? "vs" : "@"} ${g.opponent}`;

// Value of the "everything" option in every filter. Its label is dict.common.all.
export const ALL = "all";
export const SEASONS = [ALL, ...Array.from(new Set(ALL_GOALS.map((g) => g.season)))];
// Competitions in order of how many goals were scored in them.
export const COMPETITION_LIST = (() => {
  const count = new Map<string, number>();
  ALL_GOALS.forEach((g) => count.set(g.competition, (count.get(g.competition) ?? 0) + 1));
  return [ALL, ...[...count.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)];
})();

// The filters below are [id, test] pairs; the id picks the label in dict.goals, so the
// buttons read in the page's language. The first entry of each one means "everything".
type Test = [id: string, test: (g: Goal) => boolean];

// Shot-type filter buttons.
export const KINDS: Test[] = [
  [ALL, () => true],
  ["leftFoot", (g) => g.body === "Left Foot" && g.type !== "Penalty"],
  ["rightFoot", (g) => g.body === "Right Foot" && g.type !== "Penalty"],
  ["penalty", (g) => g.type === "Penalty"],
  ["freeKick", (g) => g.type === "Free Kick"],
];

export const AREAS: Test[] = [
  [ALL, () => true],
  ["inside", (g) => g.area === "inside"],
  ["outside", (g) => g.area === "outside"],
];

export const VENUES: Test[] = [
  [ALL, () => true],
  ["home", (g) => g.home],
  ["away", (g) => !g.home],
];

export const TEAMS: Test[] = [
  [ALL, () => true],
  ["Barcelona", (g) => g.team === "Barcelona"],
  ["Spain", (g) => g.team === "Spain"],
];

// [id, compare, byDate]. Date orders get split into seasons in the grid.
export const SORTS: [id: string, compare: (a: Goal, b: Goal) => number, byDate: boolean][] = [
  ["newest", (a, b) => b.n - a.n, true],
  ["oldest", (a, b) => a.n - b.n, true],
  // Goals without shot data (non-La Liga) sort last.
  ["hardest", (a, b) => (a.shot?.xg ?? 9) - (b.shot?.xg ?? 9) || b.n - a.n, false],
  ["farthest", (a, b) => (b.shot?.distance ?? -1) - (a.shot?.distance ?? -1) || b.n - a.n, false],
];

// Labels for the buttons above, in the page's language.
const named =
  (d: Dictionary, group: Record<string, string>) =>
  ([id]: [string, ...unknown[]]) =>
    id === ALL ? d.common.all : (group[id] ?? id);

export const kindLabels = (d: Dictionary) => KINDS.map(named(d, d.goals.kinds));
export const areaLabels = (d: Dictionary) => AREAS.map(named(d, d.goals.areas));
export const venueLabels = (d: Dictionary) => VENUES.map(named(d, d.goals.venues));
export const teamLabels = (d: Dictionary) => TEAMS.map(named(d, d.goals.teams));
export const sortLabels = (d: Dictionary) => SORTS.map(named(d, d.goals.sorts));
export const seasonLabels = (d: Dictionary) => SEASONS.map((s) => (s === ALL ? d.common.all : shortSeason(s)));
export const competitionLabel = (name: string, d: Dictionary) => d.goals.competitions[name] ?? name;
export const competitionLabels = (d: Dictionary) =>
  COMPETITION_LIST.map((c) => (c === ALL ? d.common.all : competitionLabel(c, d)));

export const bodyLabel = (g: Goal, d: Dictionary) => (g.body ? (d.goals.body[g.body] ?? g.body) : undefined);
export const typeLabel = (g: Goal, d: Dictionary) => d.goals.type[g.type] ?? g.type;

// Dot colour: penalties gold, otherwise blue for the left foot, garnet for the right.
export const tone = (g: Goal) =>
  g.type === "Penalty" ? "var(--gold)" : g.body === "Left Foot" ? "var(--accent)" : "var(--garnet)";

// [label key in dict.goals, colour]
export const LEGEND = [
  ["legendLeft", "var(--accent)"],
  ["legendRight", "var(--garnet)"],
  ["legendPenalty", "var(--gold)"],
] as const;

export const fmtDate = (iso: string) => iso.split("-").reverse().join("/");
export const shortSeason = (season: string) => season.replace(/20(\d\d)\/20(\d\d)/, "$1/$2");

// Pitch in metres, attacking upward: svg x = pitch width (0..68), svg y = distance from goal line.
// Only goals with shot data can be placed.
export const at = (s: Shot) => ({ x: s.y, y: 105 - s.x });

export function goalStats(goals: Goal[]) {
  const shots = goals.flatMap((g) => (g.shot ? [g.shot] : []));
  return {
    goals: goals.length,
    penalties: goals.filter((g) => g.type === "Penalty").length,
    assisted: goals.filter((g) => g.assist).length,
    outside: goals.filter((g) => g.area === "outside").length,
    // xG and distance exist for La Liga goals only.
    xg: shots.reduce((s, x) => s + x.xg, 0),
    dist: shots.length ? shots.reduce((s, x) => s + x.distance, 0) / shots.length : 0,
    tracked: shots.length,
  };
}

// ---- Search, filters and sorting for the /goals page ----

// Lowercase without accents, so a query typed without diacritics still matches
// "Tiếng Việt" or "Atlético", and "atletico" finds "Atlético".
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();

// Everything a visitor might type to find a goal, in the page's language. Built once per dictionary.
const haystacks = new WeakMap<Dictionary, Map<string, string>>();

function haystackFor(d: Dictionary) {
  let map = haystacks.get(d);
  if (!map) {
    const h = d.goals.haystack;
    map = new Map(
      ALL_GOALS.map((g) => [
        g.id,
        fold(
          [
            g.opponent,
            g.score,
            g.assist ?? h.noAssist,
            g.competition,
            competitionLabel(g.competition, d),
            g.team,
            d.goals.teams[g.team] ?? g.team,
            g.season,
            shortSeason(g.season),
            g.date,
            fmtDate(g.date),
            g.minute,
            format(h.minute, { n: parseInt(g.minute) }),
            `#${g.n}`,
            format(h.goal, { n: g.n }),
            bodyLabel(g, d) ?? "",
            typeLabel(g, d),
            g.home ? h.home : h.away,
            g.area ? d.goals.areas[g.area] : "",
          ].join(" · "),
        ),
      ]),
    );
    haystacks.set(d, map);
  }
  return map;
}

// Every word has to appear somewhere: "real 2024" finds the Clásico goal of 2024.
export function matches(g: Goal, query: string, d: Dictionary) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const hay = haystackFor(d).get(g.id) ?? "";
  return words.every((w) => hay.includes(w));
}

export type GoalQuery = {
  q: string;
  season: string;
  comp: string;
  team: number;
  kind: number;
  area: number;
  venue: number;
  sort: number;
};

export const EMPTY_QUERY: GoalQuery = { q: "", season: ALL, comp: ALL, team: 0, kind: 0, area: 0, venue: 0, sort: 0 };

export function queryGoals(f: GoalQuery, d: Dictionary) {
  return ALL_GOALS.filter(
    (g) =>
      (f.season === ALL || g.season === f.season) &&
      (f.comp === ALL || g.competition === f.comp) &&
      TEAMS[f.team][1](g) &&
      KINDS[f.kind][1](g) &&
      AREAS[f.area][1](g) &&
      VENUES[f.venue][1](g) &&
      matches(g, f.q, d),
  ).sort(SORTS[f.sort][1]);
}
