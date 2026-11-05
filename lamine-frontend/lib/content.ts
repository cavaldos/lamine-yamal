// The site's content: facts, videos and photos. The words around them (chapter stories,
// trophy notes, captions) live in lib/i18n/dictionaries/, one
// file per language, and are matched to the entries here by `id` / YouTube id.
// To swap in your own media:
//   - photos: drop files into /public/images/... and set `photo` / `src` to "/images/...".
//   - videos: set `youtube` to the id from the URL (youtube.com/watch?v=<id>).
// Anything without a photo renders a styled "DEMO PHOTO" placeholder.

import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export const PLAYER = {
  name: "Lamine Yamal",
  fullName: "Lamine Yamal Nasraoui Ebana",
  born: "2007-07-13",
  birthplace: "Esplugues de Llobregat, Catalonia",
  hometown: "Rocafonda, Mataró",
  club: "FC Barcelona",
  shirt: 10,
  position: "Right winger",
};

export type ChapterId = keyof Dictionary["journey"]["chapters"];

export type Chapter = {
  id: ChapterId;
  year: string;
  stat?: string; // the big number; its label is the chapter's `statLabel`
  photo?: string;
};

// The scroll-world flight, in order.
export const JOURNEY: Chapter[] = [
  { id: "rocafonda", year: "2007", stat: "304", photo: "/journey/2007-rocafonda.jpg" },
  { id: "messi", year: "2007", photo: "/journey/2007-messi.jpg" },
  { id: "laMasia", year: "2014", stat: "7", photo: "/journey/2014-la-masia.jpg" },
  { id: "debut", year: "2023", stat: "15", photo: "/journey/2023-debut.jpg" },
  { id: "firstGoal", year: "2023", stat: "16" },
  { id: "euroGoal", year: "2024", stat: "16", photo: "/journey/2024-euro-goal.webp" },
  { id: "euroChampion", year: "2024", photo: "/journey/2024-euro-champion.webp" },
  { id: "treble", year: "2025", stat: "10", photo: "/journey/2025-copa-del-rey.jpg" },
  { id: "worldCup", year: "2026", stat: "19", photo: "/journey/2026-world-cup.jpg" },
];

// A chapter with its words in the page's language.
export type LocalizedChapter = Chapter & Dictionary["journey"]["chapters"][ChapterId];

export const chaptersFor = (dict: Dictionary): LocalizedChapter[] =>
  JOURNEY.map((c) => ({ ...c, ...dict.journey.chapters[c.id] }));

export type Trophy = {
  id: "worldCup" | "euro" | "laLiga" | "copaDelRey" | "supercopa";
  name: string; // official names, kept as they are in every language
  scope: "club" | "country";
  years: string[];
  featured?: boolean; // shown large, with a note from dict.trophies.notes
};

// Team trophies. Double-check new seasons against FC Barcelona / RFEF records.
export const TROPHIES: Trophy[] = [
  { id: "worldCup", name: "FIFA World Cup", scope: "country", years: ["2026"], featured: true },
  { id: "euro", name: "UEFA EURO", scope: "country", years: ["2024"], featured: true },
  { id: "laLiga", name: "La Liga", scope: "club", years: ["2022/23", "2024/25", "2025/26"] },
  { id: "copaDelRey", name: "Copa del Rey", scope: "club", years: ["2024/25"] },
  { id: "supercopa", name: "Supercopa de España", scope: "club", years: ["2025", "2026"] },
];

// Totals derived from the list above (used by the hero and the trophies section).
export const TEAM_TITLE_COUNT = TROPHIES.reduce((n, t) => n + t.years.length, 0);
export const COUNTRY_TITLE_COUNT = TROPHIES.filter((t) => t.scope === "country").reduce(
  (n, t) => n + t.years.length,
  0,
);

// Award names are in dict.trophies.awards.
export const AWARDS: { id: keyof Dictionary["trophies"]["awards"]; year: string }[] = [
  { id: "goldenBoy", year: "2024" },
  { id: "kopa", year: "2024 · 2025 · 2026" },
  { id: "euroYoung", year: "2024" },
  { id: "laureus", year: "2025" },
  { id: "laureusYoung", year: "2026" },
  { id: "laligaPlayer", year: "2025/26" },
];

// The men's Ballon d'Or, one entry per edition he was shortlisted for (the first was 2024),
// oldest first. `top` is that year's podium, so it includes him when he made it.
// Points as France Football published them after each ceremony.
export type BallonDorEdition = {
  year: string;
  rank: number;
  points: number;
  top: { name: string; points: number }[]; // places 1, 2 and 3, in order
  kopa?: boolean; // also took the Kopa Trophy (best under-21) that night
};

export const BALLON_DOR: BallonDorEdition[] = [
  {
    year: "2024",
    rank: 8,
    points: 383,
    kopa: true,
    top: [
      { name: "Rodri", points: 1170 },
      { name: "Vinícius Júnior", points: 1129 },
      { name: "Jude Bellingham", points: 917 },
    ],
  },
  {
    year: "2025",
    rank: 2,
    points: 1059,
    kopa: true,
    top: [
      { name: "Ousmane Dembélé", points: 1380 },
      { name: "Lamine Yamal", points: 1059 },
      { name: "Vitinha", points: 703 },
    ],
  },
  {
    year: "2026",
    rank: 3,
    points: 881,
    kopa: true,
    top: [
      { name: "Harry Kane", points: 1055 },
      { name: "Kylian Mbappé", points: 1027 },
      { name: "Lamine Yamal", points: 881 },
    ],
  },
];

export type Video = { youtube: string; title: string; source: string; length?: string };

// The clip that loops, muted, behind the home page's highlights section.
export const HIGHLIGHT_LOOP: Video = {
  youtube: "WXpSDZzRCPI",
  title: "Rabona against Galatasaray",
  source: "Jens E",
};

// The videos on /highlights live in data/lamine_yamal_highlights.json and Notion: see lib/highlights.ts.

export const CHILDHOOD_VIDEOS: Video[] = [
  {
    youtube: "xzehnfQTM94",
    title: "Lamine at 13 — already everything a star needs",
    source: "Reykob 7.0",
    length: "14:20",
  },
  { youtube: "f3x_xKWfpiU", title: "Lamine & Pau Cubarsí at 11", source: "Maximum Pro", length: "9:19" },
  { youtube: "kiHljIHu1wU", title: "Lamine at 12", source: "SV2", length: "16:34" },
  { youtube: "l7whDJSE1HU", title: "Alevín A, 2018/19 season", source: "La Masia Talents", length: "4:25" },
  { youtube: "-NDXPL64KOI", title: "A match at 11 years old", source: "ArtSoccer", length: "12:58" },
  {
    youtube: "XxjVxxfrnj0",
    title: "His best match at La Masia (full match)",
    source: "FC Barcelona",
    length: "56:25",
  },
];

// Captions are in dict.archive.captions, in this order.
export type Photo = { year: string; src?: string };

// Archive reel. Replace `src` with your own photos (e.g. "/images/archive/01.jpg").
export const ARCHIVE_PHOTOS: Photo[] = [
  { year: "2007" },
  { year: "2010" },
  { year: "2014" },
  { year: "2017" },
  { year: "2019" },
  { year: "2021" },
  { year: "2022" },
  { year: "2023" },
];

// Photos for the spinning gallery behind the hero title.
// For now these are thumbnails of the YouTube videos featured on the site (mostly
// FC Barcelona, LALIGA and UEFA uploads). To use your own photos, put files in
// /public/images/hero/ and list them here instead, e.g. "/images/hero/01.jpg".
// hqdefault is ~30KB (vs ~375KB for hq720). It is 4:3 with black bars; the gallery
// cover-fits it into 16:9, which crops the bars off exactly.
const yt = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const HERO_IMAGES: string[] = [
  "cQQsgMpy2cA",
  "GeONdafonl4",
  "lACgOT_5zNU",
  "61H0uDv3WTg",
  "8Wa2p3Tz7Ts",
  "JfP7zfeQrG4",
  "M37orXBtvtg",
  "J0s6gT8OCJc",
  "CzWXyBmwKTc",
  "FJjRJbRPExM",
  "KMpRz2q-w_Y",
  "EV7gjjAM4bc",
  "MZ5z-dLhjUE",
  "bUMVUC2uQJY",
  "iMvXat8xQos",
  "_UVK0h72UB0",
  "CxumhgRBmP8",
  "4z-s3zRku20",
  "p_aSpG4jZSU",
  "qTaeQXFYa34",
  "Ftu--ea1haE",
  "MIKSbfmUXSE",
  "rOkllIBU2do",
  "FY8ASN1VV-8",
].map(yt);

// Shirt stripes used for placeholders and accents.
export const STRIPES = ["var(--accent)", "var(--garnet)"];
