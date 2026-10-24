// Stand-in clips for goals that have no `youtube` link yet in data/goals.json.
// Keyed by the goal's number in the old La Liga-only data (`shot.legacyN`).
// Goals without an entry (other competitions) cycle through DEMO_POOL. Most are fan uploads of a goal against the same
// opponent, found by search and not checked frame by frame, so the page marks
// every one of them "Demo". Once a goal has its own `youtube`, its demo is ignored.
//
// Use a /shorts/ link for vertical clips; anything else plays 16:9.
// An entry can also trim a long video: { url, start, end } in seconds.
export type DemoVideo = string | { url: string; start?: number; end?: number };

// A 12-minute 16:9 compilation, cut into short pieces below to try out trimming.
const COMPILATION = "https://www.youtube.com/watch?v=IaS66Nj6kdA";

export const DEMO_VIDEOS: Record<number, DemoVideo> = {
  1: "https://youtu.be/UrAWY9OetWE",
  2: "https://youtu.be/jLf_KdcXWTQ", // FC Barcelona match highlights (3:28)
  3: "https://youtu.be/QE-MoXPOprQ",
  4: "https://youtu.be/4ooSlQy4K9A", // FC Barcelona match highlights (3:26)
  5: { url: COMPILATION, start: 30, end: 55 },
  6: "https://youtu.be/yx8uMAI3Thk", // FC Barcelona match highlights (3:40)
  7: "https://www.youtube.com/shorts/5cT8PBwh5RE",
  8: "https://www.youtube.com/shorts/N0tyzD1_87E",
  9: { url: COMPILATION, start: 200, end: 225 },
  10: "https://youtu.be/q-Krz-LrgPo",
  11: "https://youtu.be/-d2KKka68M8",
  12: "https://www.youtube.com/shorts/Ix6ft6F394U",
  13: "https://youtu.be/psoHFP6-2iA", // FIFA Puskás 2025 nominee clip
  14: "https://www.youtube.com/shorts/7uprChGpOKE",
  15: "https://www.youtube.com/shorts/EY4pE7uxHSc",
  16: "https://www.youtube.com/shorts/-ac5u2bg_ls",
  17: "https://www.youtube.com/shorts/7x_3uPmM3Gw",
  18: "https://www.youtube.com/shorts/KG7OWRtmloo",
  19: "https://www.youtube.com/shorts/bqgKhGNMXNo",
  20: "https://www.youtube.com/shorts/jdjLEuQFqRQ",
  21: "https://www.youtube.com/shorts/lw3fSiPpJfk",
  22: { url: COMPILATION, start: 400, end: 425 },
  23: "https://youtu.be/cznY5IFc5mw",
  24: "https://youtu.be/PEzP68I1cG8",
  25: "https://www.youtube.com/shorts/3rBM-SPFMfg",
  26: "https://www.youtube.com/shorts/j6gtBuGzee4",
  27: "https://www.youtube.com/shorts/WX19W7L-36g",
  28: "https://www.youtube.com/shorts/1CUE0nO2fI0",
  29: "https://www.youtube.com/shorts/lciHjxQEIcQ",
  30: "https://www.youtube.com/shorts/QTmhe4Aolvo",
  31: COMPILATION, // untrimmed: plays all 12 minutes
  32: "https://www.youtube.com/shorts/z64_QWsfQa8",
  33: "https://www.youtube.com/shorts/Poh02g-shG0",
  34: "https://www.youtube.com/shorts/1WfLiM7UVDg",
  35: "https://www.youtube.com/shorts/7ZADrvHJdDw",
  36: "https://www.youtube.com/shorts/k-Xo6O4JoFs",
  37: "https://www.youtube.com/shorts/ZtO9pfVwlOc",
};

// Stand-ins for goals that have no entry above: a mix of Shorts and 16:9 clips.
export const DEMO_POOL: DemoVideo[] = [
  "https://www.youtube.com/shorts/bqgKhGNMXNo",
  "https://www.youtube.com/shorts/eNJtXsCabx0",
  "https://youtu.be/-d2KKka68M8",
  "https://www.youtube.com/shorts/T7qUN4g6SLY",
  { url: COMPILATION, start: 120, end: 145 },
  "https://www.youtube.com/shorts/7w-5EnY2AUo",
  "https://www.youtube.com/shorts/dOvlhKv85b0",
  { url: COMPILATION, start: 300, end: 325 },
  "https://www.youtube.com/shorts/fktq0ngRA8M",
];
