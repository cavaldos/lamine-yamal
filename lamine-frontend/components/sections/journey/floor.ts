import {
  CAM_HEIGHT,
  clamp01,
  DEPTH,
  N,
  PARTICLES,
  PERSPECTIVE,
  STRIPE,
  VIEW_STATIONS,
} from "@/components/sections/journey/world";

// The canvas behind the stations: a mowed pitch receding to the horizon and
// coloured motes in the air, drawn with the same projection as the DOM.

export type FloorColors = { line: string; accent: string; garnet: string; gold: string };
type Mote = { x: number; y: number; z: number; c: number };

// Deterministic scatter so the motes are the same on every visit.
export function createMotes(): Mote[] {
  const span = (N - 1 + VIEW_STATIONS + 1) * DEPTH;
  const seed = (n: number) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  return Array.from({ length: PARTICLES }, (_, k) => ({
    x: (seed(k) - 0.5) * 2.6,
    y: seed(k + 0.5) * 1.6 - 1.1,
    z: seed(k + 0.25) * span - DEPTH,
    c: k % 7 === 0 ? 2 : k % 2,
  }));
}

export function readFloorColors(prev: FloorColors): FloorColors {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    line: v("--ink", prev.line),
    accent: v("--accent", prev.accent),
    garnet: v("--garnet", prev.garnet),
    gold: v("--gold", prev.gold),
  };
}

export function drawFloor(
  ctx: CanvasRenderingContext2D,
  { w, h, dpr, camZ, colors, motes }: { w: number; h: number; dpr: number; camZ: number; colors: FloorColors; motes: Mote[] },
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.5;
  const far = VIEW_STATIONS * DEPTH;
  const pitchHalf = Math.max(w * 0.9, 900);

  // Mowing stripes: bands of the pitch receding to the horizon.
  const first = Math.floor((camZ - PERSPECTIVE) / STRIPE);
  for (let k = first; k * STRIPE < camZ + far; k++) {
    const d0 = Math.max(60, k * STRIPE - camZ + PERSPECTIVE);
    const d1 = (k + 1) * STRIPE - camZ + PERSPECTIVE;
    if (d1 <= 60) continue;
    const fog = 1 - clamp01((d0 - PERSPECTIVE) / far);
    const y0 = cy + (CAM_HEIGHT * PERSPECTIVE) / d0;
    const y1 = cy + (CAM_HEIGHT * PERSPECTIVE) / d1;
    const half0 = (pitchHalf * PERSPECTIVE) / d0;
    const half1 = (pitchHalf * PERSPECTIVE) / d1;
    ctx.globalAlpha = (k % 2 === 0 ? 0.07 : 0.025) * fog;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(cx - half0, y0);
    ctx.lineTo(cx + half0, y0);
    ctx.lineTo(cx + half1, y1);
    ctx.lineTo(cx - half1, y1);
    ctx.fill();
    ctx.globalAlpha = 0.16 * fog;
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - half1, y1);
    ctx.lineTo(cx + half1, y1);
    ctx.stroke();
  }

  // Touchlines and the halfway line run to the vanishing point.
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = colors.line;
  for (const sx of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * pitchHalf * 1.6, h);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  // Motes drifting in the air above the pitch.
  const palette = [colors.accent, colors.garnet, colors.gold];
  for (const m of motes) {
    const dist = m.z - camZ + PERSPECTIVE;
    if (dist < 80 || dist > far + PERSPECTIVE) continue;
    const s = PERSPECTIVE / dist;
    const fog = 1 - clamp01((dist - PERSPECTIVE) / far);
    const near = clamp01((dist - 80) / 300);
    ctx.globalAlpha = 0.85 * fog * near;
    ctx.fillStyle = palette[m.c];
    ctx.beginPath();
    ctx.arc(cx + m.x * w * s, cy + m.y * h * s, Math.max(0.6, 2.6 * s), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
