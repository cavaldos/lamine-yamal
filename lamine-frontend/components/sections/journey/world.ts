import { JOURNEY } from "@/lib/content";

// Scroll world geometry. The section pins, and scrolling flies a camera down a
// pitch through every chapter ("station"). Scroll only drives the camera
// position; Lenis supplies the smoothing, so everything here is a pure function.
//
// The DOM stations and the canvas floor share one projection: a point `dist`
// px in front of the camera lands at scale PERSPECTIVE / dist.

// ── Tuning ────────────────────────────────────────────────────────────────
export const PERSPECTIVE = 1000; // px, CSS perspective of every station
export const DEPTH = 1700; // px between stations along the flight path
export const SCROLL_PER = 1.15; // viewport heights of scroll per station
export const PAD = 0.3; // extra dwell before the first and after the last station
export const LINGER = 0.55; // 0..1: slow at each station, quicker between them
export const SWAY = 62; // vw off-centre (before perspective) a station sits one station away
export const TURN = 9; // deg a far station is angled toward the path
export const FAR_FADE: [number, number] = [1.1, 2.6]; // stations ahead: fully shown → gone
export const PASS_FADE = 0.32; // stations behind fade out within this many stations
export const CAM_HEIGHT = 300; // px the camera flies above the pitch
export const STRIPE = 420; // px depth of each mowing stripe
export const VIEW_STATIONS = 3.2; // how far ahead the floor and particles are drawn
export const PARTICLES = 150;
export const NAV_H = 48;

export const N = JOURNEY.length;

// Section height: enough scroll for every station plus one pinned screen.
export const SECTION_HEIGHT = `calc(${((N - 1 + 2 * PAD) * SCROLL_PER * 100).toFixed(1)}svh + 100svh)`;

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Station i relative to the camera; d = i - cam (0 = in focus, < 0 = passed).
export function place(i: number, d: number) {
  const side = i % 2 === 0 ? -1 : 1;
  const ahead = Math.max(0, d);
  const x = side * Math.min(ahead, 3) * SWAY;
  const z = Math.min(-d * DEPTH, PERSPECTIVE * 0.8);
  const rot = -side * Math.min(ahead, 2) * TURN;
  const opacity = d < 0 ? 1 - clamp01(-d / PASS_FADE) : 1 - smooth(FAR_FADE[0], FAR_FADE[1], d);
  return {
    transform: `translate3d(${x.toFixed(3)}vw,0,${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`,
    opacity,
  };
}

// Scroll progress 0..1 → camera position in stations, with a linger at each one.
export function camera(p: number) {
  const s = Math.min(N - 1, Math.max(0, p * (N - 1 + 2 * PAD) - PAD));
  const i = Math.floor(s);
  const f = s - i;
  return i + f - (LINGER * Math.sin(2 * Math.PI * f)) / (2 * Math.PI);
}

// The inverse for jumping: station i sits at linger phase 0, so s = i exactly.
export const progressForStation = (i: number) => (i + PAD) / (N - 1 + 2 * PAD);
