// Procedural "film still" placeholders for the hero spiral when no photos are given.
// Seeded, so every visit draws the same frames.

type Palette = {
  sky: [string, string, string];
  sun: string;
  layers: string[]; // far → near
  glow: string;
  night?: boolean;
};

const PALETTES: Palette[] = [
  // dusk desert
  { sky: ["#f6c27a", "#e9884a", "#7a3b2a"], sun: "#fff1c9", layers: ["#c46a35", "#9c4a24", "#5e2a16"], glow: "#ffb36b" },
  // blue hour mountains
  { sky: ["#0d1b3d", "#2c4a8a", "#9db7e8"], sun: "#e8f0ff", layers: ["#3a5288", "#22355f", "#0f1a33"], glow: "#7fa6ff", night: true },
  // neon night
  { sky: ["#0a0614", "#2a0f3d", "#6d1b6b"], sun: "#ff5fd2", layers: ["#341652", "#1c0c30", "#09040f"], glow: "#00e0ff", night: true },
  // misty forest
  { sky: ["#c9d6cf", "#8fa99c", "#4b6b5c"], sun: "#f3f7f2", layers: ["#6f8f7e", "#3f5e4d", "#1d3328"], glow: "#e1efe6" },
  // storm sea
  { sky: ["#1b2329", "#3a4a55", "#7d8f99"], sun: "#dfe9ef", layers: ["#2e3d47", "#1c2830", "#0b1115"], glow: "#b9d4e3", night: true },
  // golden field
  { sky: ["#fde6b0", "#f4b860", "#b86b2b"], sun: "#fff8e0", layers: ["#c98d3b", "#8a5a22", "#3f2a10"], glow: "#ffd27a" },
  // arctic
  { sky: ["#e7f2fb", "#a8cbe6", "#4d7da6"], sun: "#ffffff", layers: ["#b9d3e6", "#7fa3c2", "#355a7a"], glow: "#ffffff" },
  // red planet
  { sky: ["#2a0d08", "#7a2412", "#e0602f"], sun: "#ffd2a6", layers: ["#9a3415", "#5c1d0b", "#240a04"], glow: "#ff7a3d", night: true },
  // teal lagoon
  { sky: ["#063a45", "#0d7a83", "#7fd6c8"], sun: "#f1fff9", layers: ["#0e6168", "#073f45", "#02191c"], glow: "#86ffe5" },
  // violet canyon
  { sky: ["#1d1240", "#5b3a8f", "#e2a0c8"], sun: "#ffe3f3", layers: ["#6b3f8a", "#3e2260", "#170b2a"], glow: "#ff9ad5", night: true },
];

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

function ridge(r: () => number, base: number, amp: number, steps: number) {
  const pts: string[] = [`0,90`];
  let y = base + (r() - 0.5) * amp;
  for (let i = 0; i <= steps; i++) {
    const x = (160 / steps) * i;
    y += (r() - 0.5) * amp * 0.9;
    y = Math.min(88, Math.max(base - amp, y));
    pts.push(`${round(x)},${round(y)}`);
  }
  pts.push("160,90");
  return pts.join(" ");
}

type Scene = ReturnType<typeof buildScene>;

function buildScene(seed: number) {
  const r = rng(seed + 7);
  const p = PALETTES[seed % PALETTES.length];
  const id = `sa${seed}`;
  const sunX = round(20 + r() * 120);
  const sunY = round(18 + r() * 26);
  const sunR = round(5 + r() * 9);
  const night = p.night && seed % 3 !== 0;
  const stars = night
    ? Array.from({ length: 18 }, () => [round(r() * 160), round(r() * 45), round(0.3 + r() * 0.6)])
    : [];
  const horizon = 50 + r() * 14;
  const ridges = p.layers.map((c, i) => ({
    color: c,
    points: ridge(r, horizon + i * 9, 16 - i * 3, 7 + i * 3),
    opacity: i === 0 ? 0.85 : 1,
  }));
  // A lone figure on most frames gives them a sense of scale.
  const figure = r() > 0.35;
  const fx = round(30 + r() * 100);
  const fy = round(horizon + 18 + r() * 8);
  const fh = round(6 + r() * 6);
  const body = `M${fx - fh * 0.18} ${fy - fh} h${fh * 0.36} l${fh * 0.12} ${fh} h${-fh * 0.6}Z`;
  return { p, id, sunX, sunY, sunR, stars, horizon, ridges, figure, fx, fy, fh, body };
}

// The same frame as a standalone SVG string, for rasterising into a WebGL texture.
export function sceneArtMarkup(seed: number): string {
  const s: Scene = buildScene(seed);
  const { p, id } = s;
  const stop = (o: number, c: string, a = 1) =>
    `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" width="160" height="90" preserveAspectRatio="xMidYMid slice"><defs>`,
    `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1">${stop(0, p.sky[0])}${stop(0.55, p.sky[1])}${stop(1, p.sky[2])}</linearGradient>`,
    `<radialGradient id="${id}g" cx="${s.sunX / 160}" cy="${s.sunY / 90}" r="0.55">${stop(0, p.glow, 0.75)}${stop(1, p.glow, 0)}</radialGradient>`,
    `<radialGradient id="${id}v" cx="0.5" cy="0.5" r="0.75">${stop(0.55, "#000", 0)}${stop(1, "#000", 0.55)}</radialGradient>`,
    `<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1">${stop(0, p.glow, 0)}${stop(1, p.glow, 0.35)}</linearGradient>`,
    `</defs>`,
    `<rect width="160" height="90" fill="url(#${id}s)"/>`,
    ...s.stars.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.7"/>`),
    `<rect width="160" height="90" fill="url(#${id}g)"/>`,
    `<circle cx="${s.sunX}" cy="${s.sunY}" r="${s.sunR}" fill="${p.sun}" opacity="0.92"/>`,
    `<rect y="${s.horizon - 14}" width="160" height="16" fill="url(#${id}h)"/>`,
    ...s.ridges.map((g) => `<polygon points="${g.points}" fill="${g.color}" opacity="${g.opacity}"/>`),
    s.figure
      ? `<g fill="${p.layers[2]}"><circle cx="${s.fx}" cy="${s.fy - s.fh - 1.4}" r="${s.fh * 0.16}"/><path d="${s.body}"/></g>`
      : "",
    `<rect width="160" height="90" fill="url(#${id}v)"/>`,
    `</svg>`,
  ].join("");
}
