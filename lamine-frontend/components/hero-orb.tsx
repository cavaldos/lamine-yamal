"use client";

import { useEffect, useRef } from "react";
import { sceneArtMarkup } from "./scene-art";

// A slow spiral galaxy of film stills. Cards are born small and soft at the
// centre, then drift outward along six arms, growing and sharpening as they go.
// Everything is drawn with raw WebGL2: each card is a pillow-curved quad seen
// through a real perspective, so cards near the screen edge bow visibly.

// ── Tuning ────────────────────────────────────────────────────────────────
const ARMS = 6;
const TURNS = 1.05; // windings the spiral makes before reaching SPAN
const SPAN = 0.7; // spiral radius after TURNS, × viewport half-diagonal
const BIRTH = 0.08; // where along the arm cards appear (fraction of TURNS)
const MAX_CARDS = 64;
const CARDS_PER_MPX = 64 / 1.65; // fewer cards on smaller screens
const DENSITY = 0.82; // share of arm slots that hold a card
const CARD_H = 0.21; // card height cap, × viewport height
const INNER = 0.42; // card scale at birth, relative to the cap
const ASPECTS = [16 / 9, 4 / 3, 16 / 9, 2.1, 3 / 2, 16 / 9, 1.25];
const LAPS_PER_SEC = 0.57 / 60; // outward drift
const SPIN = ((-50 * Math.PI) / 180) / 60; // whole-field rotation, rad/s
const SCRUB = 0.2 / 1000; // extra drift per scrolled px
const WOBBLE_PX = 6;
const WOBBLE_HZ = 0.25;
const FOV = (40 * Math.PI) / 180;
const BOW_PX = 32; // centre-to-corner depth of each card's pillow curve
const LIFT_PX = 110; // how far the pointer pulls a card toward the viewer
const CORNER_PX = 10;
const SPLIT = 0.05; // chromatic split at card edges
const SOFT_MAX = 0.11; // defocus radius at birth, in card UV
const SOFT_END = 0.2; // radius (× half-diagonal) where cards are fully sharp
const RIM_ALPHA = 0.1;
const LINE_ALPHA = 0.065;
const TICK_ALPHA = 0.16;
const TICKS_PER_ARM = 16;
const CIRCLE = 0.56; // construction circle radius, × half-diagonal
const PULSES = 3; // comets per arm
const PULSE_RATE = 0.19;
const PULSE_TAIL = 0.12;
const PULSE_ALPHA = 0.72;
const PULSE_SWELL_PX = 3.5;
const HUE_STEP = 0.4; // turns of hue between neighbouring arms
const INTRO_S = 4;
const BURST = 3; // drift speed multiplier right after load
const BURST_S = 2.5;
const WAVE_PX = 220; // softness of the intro reveal front
const SCENES = 18;
const TEX_W = 512;
const TEX_H = 288;
const GRID = 12;

// ── Shaders ───────────────────────────────────────────────────────────────
const CARD_VS = `#version 300 es
in vec2 aPos;          // card-local, -0.5..0.5, y down
uniform vec2 uHalf;    // half viewport, css px
uniform float uFocal;
uniform vec2 uCenter;  // card centre, px from screen centre, y down
uniform vec2 uSize;
uniform float uBow;
uniform vec3 uPress;   // xy pointer px, z lift px
out vec2 vUv;
void main() {
  vUv = aPos + 0.5;
  vec2 p = uCenter + aPos * uSize;
  // Pillow: middle forward, corners back.
  float z = uBow * (0.5 - 2.0 * dot(aPos, aPos));
  vec2 m = (p - uPress.xy) / (max(uSize.x, uSize.y) * 0.7);
  z += uPress.z * exp(-dot(m, m));
  gl_Position = vec4(p.x / uHalf.x, -p.y / uHalf.y, 0.0, (uFocal - z) / uFocal);
}`;

const CARD_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec4 uCrop;    // xy offset, zw extent of the cover-fit window
uniform vec2 uSize;
uniform float uRadius;
uniform float uSoft;
uniform float uSplit;
uniform float uFade;
uniform float uLoaded;
uniform float uRim;
uniform vec3 uBase;
uniform vec3 uRimColor;
in vec2 vUv;
out vec4 outColor;

vec3 tap(vec2 uv, float lod) {
  return texture(uTex, clamp(uv, uCrop.xy, uCrop.xy + uCrop.zw), lod).rgb;
}

void main() {
  vec2 uv = uCrop.xy + vUv * uCrop.zw;
  vec3 c;
  if (uSoft > 0.0005) {
    // Defocus: a golden-angle disc of taps on a blurrier mip.
    float lod = log2(1.0 + uSoft * 60.0);
    c = vec3(0.0);
    for (int i = 0; i < 10; i++) {
      float f = (float(i) + 0.5) / 10.0;
      float a = float(i) * 2.39996;
      c += tap(uv + vec2(cos(a), sin(a)) * sqrt(f) * uSoft * uCrop.zw, lod);
    }
    c /= 10.0;
  } else {
    // Lens fringe: red and blue drift apart toward the rim.
    vec2 d = vUv - 0.5;
    vec2 off = d * dot(d, d) * uSplit * uCrop.zw;
    c = vec3(tap(uv + off, 0.0).r, tap(uv, 0.0).g, tap(uv - off, 0.0).b);
  }
  c = mix(uBase, c, uLoaded);

  // Rounded corners and a hairline rim that follows them.
  vec2 q = abs((vUv - 0.5) * uSize) - (uSize * 0.5 - uRadius);
  float e = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float rim = 1.0 - smoothstep(0.0, 1.2, abs(e + 1.0));
  c = mix(c, uRimColor, rim * uRim);
  float a = uFade * clamp(0.5 - e, 0.0, 1.0);
  outColor = vec4(c * a, a);
}`;

const LINE_VS = `#version 300 es
in vec2 aPos;
in vec2 aDir;          // unit offset direction for the ribbon width
in float aSide;        // -1 / +1
in float aAlong;       // 0..1 along an arm, < 0 for plain strokes
uniform vec2 uHalf;
uniform float uAngle;
uniform float uWidth;
uniform float uSwell;
uniform float uClock;  // pulse clock, already scaled by speed
uniform float uLag;
uniform float uReveal;
uniform float uWave;
out float vHot;
out float vSide;
out float vShow;
void main() {
  mat2 r = mat2(cos(uAngle), sin(uAngle), -sin(uAngle), cos(uAngle));
  vec2 p = r * aPos;
  float hot = 0.0;
  if (aAlong >= 0.0) {
    // Comets run outward; 'behind' is 0 at a head and grows down its tail.
    float behind = fract(uClock - aAlong * ${PULSES.toFixed(1)} + uLag);
    hot = exp(-behind / ${PULSE_TAIL}) * smoothstep(0.0, 0.006, behind);
    hot *= smoothstep(0.03, 0.12, aAlong);
  }
  float show = clamp((uReveal - length(aPos)) / uWave, 0.0, 1.0);
  vHot = hot * show;
  vShow = show;
  vSide = aSide;
  p += r * aDir * aSide * (uWidth + uSwell * hot) * 0.5;
  gl_Position = vec4(p.x / uHalf.x, -p.y / uHalf.y, 0.0, 1.0);
}`;

const LINE_FS = `#version 300 es
precision highp float;
uniform vec3 uInk;
uniform vec3 uHotColor;
uniform float uAlpha;
uniform float uHotAlpha;
in float vHot;
in float vSide;
in float vShow;
out vec4 outColor;
void main() {
  float soft = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
  float h = clamp(vHot, 0.0, 1.0);
  vec3 c = mix(uInk, uHotColor, h);
  float a = (uAlpha * vShow + uHotAlpha * h) * soft;
  outColor = vec4(c * a, a);
}`;

// ── Helpers ───────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function rgbToHsl([r, g, b]: RGB): RGB {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]: RGB): RGB {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
    }
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
  }
  const u = new Proxy({} as Record<string, WebGLUniformLocation | null>, {
    get: (cache, name: string) =>
      name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(prog, name)),
  });
  return { prog, u };
}

// Ribbon vertex: x, y, dirX, dirY, side, along
const STRIDE = 6;

function pushStrip(
  out: number[],
  pts: [number, number][],
  along: (k: number) => number,
) {
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(pts.length - 1, k + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l;
    const ny = tx / l;
    const t = along(k);
    out.push(pts[k][0], pts[k][1], nx, ny, -1, t, pts[k][0], pts[k][1], nx, ny, 1, t);
  }
}

export default function HeroOrb() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    const cv = canvas.current;
    if (!el || !st || !cv) return;
    const gl = cv.getContext("webgl2", { antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Programs and static buffers
    const card = compile(gl, CARD_VS, CARD_FS);
    const line = compile(gl, LINE_VS, LINE_FS);

    const cardVao = gl.createVertexArray();
    gl.bindVertexArray(cardVao);
    const grid: number[] = [];
    for (let j = 0; j <= GRID; j++) {
      for (let i = 0; i <= GRID; i++) grid.push(i / GRID - 0.5, j / GRID - 0.5);
    }
    const idx: number[] = [];
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const a = j * (GRID + 1) + i;
        idx.push(a, a + 1, a + GRID + 1, a + 1, a + GRID + 2, a + GRID + 1);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(card.prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    const lineVao = gl.createVertexArray();
    gl.bindVertexArray(lineVao);
    const lineBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    const attrs: [string, number, number][] = [
      ["aPos", 2, 0],
      ["aDir", 2, 2],
      ["aSide", 1, 4],
      ["aAlong", 1, 5],
    ];
    for (const [name, size, off] of attrs) {
      const loc = gl.getAttribLocation(line.prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
    }
    gl.bindVertexArray(null);

    // ── Scene textures, rasterised from the procedural SVG frames
    const scratch = document.createElement("canvas");
    scratch.width = TEX_W;
    scratch.height = TEX_H;
    const sctx = scratch.getContext("2d");
    const textures: WebGLTexture[] = [];
    const loadedAt = new Float32Array(SCENES).fill(-1);
    for (let i = 0; i < SCENES; i++) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textures.push(tex);
    }
    let disposed = false;
    const loadScene = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (disposed || !sctx) return resolve();
          sctx.clearRect(0, 0, TEX_W, TEX_H);
          sctx.drawImage(img, 0, 0, TEX_W, TEX_H);
          gl.bindTexture(gl.TEXTURE_2D, textures[i]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
          gl.generateMipmap(gl.TEXTURE_2D);
          loadedAt[i] = performance.now();
          kick();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneArtMarkup(i * 3 + 1))}`;
      });
    // One at a time keeps the main thread smooth during the intro.
    (async () => {
      for (let i = 0; i < SCENES && !disposed; i++) await loadScene(i);
    })();

    // ── Theme colours
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const readColor = (name: string, fallback: RGB): RGB => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (!v || !probe) return fallback;
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = "#000";
      probe.fillStyle = v;
      probe.fillRect(0, 0, 1, 1);
      const d = probe.getImageData(0, 0, 1, 1).data;
      return d[3] ? [d[0] / 255, d[1] / 255, d[2] / 255] : fallback;
    };
    let ink: RGB = [0.5, 0.5, 0.5];
    let base: RGB = [0.1, 0.1, 0.1];
    let armColors: RGB[] = [];
    const readTheme = () => {
      ink = readColor("--ink", ink);
      base = readColor("--bg-sunken", base);
      const [h, s, l] = rgbToHsl(readColor("--accent", [0.18, 0.5, 1]));
      armColors = Array.from({ length: ARMS }, (_, a) =>
        hslToRgb([(h + a * HUE_STEP) % 1, Math.min(1, s * 0.95), Math.min(0.62, l)]),
      );
    };

    // ── Layout (rebuilt on resize)
    let w = 0;
    let h = 0;
    let dpr = 1;
    let half = 0; // viewport half-diagonal
    let pitch = 0; // spiral r = pitch × θ
    let thBirth = 0;
    let thEnd = 0;
    let cardH = 0;
    let cardCount = 0;
    let perArm = 0;
    let focal = 1;
    let armVerts = 0;
    let tickStart = 0;
    let tickVerts = 0;
    let circStart = 0;
    let circVerts = 0;

    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;

      half = Math.hypot(w, h) / 2;
      const T = TURNS * Math.PI * 2;
      pitch = (SPAN * half) / T;
      cardH = Math.min(340, Math.max(70, h * CARD_H));
      thBirth = BIRTH * T;
      thEnd = (half + 1.5 * cardH) / pitch;
      focal = h / 2 / Math.tan(FOV / 2);
      const mpx = (w * h) / 1e6;
      cardCount = Math.max(8, Math.min(MAX_CARDS, Math.round(CARDS_PER_MPX * mpx)));
      perArm = Math.ceil(cardCount / ARMS);

      const data: number[] = [];
      const ARM_STEPS = 240;
      const th0 = thBirth * 0.3;
      for (let a = 0; a < ARMS; a++) {
        const off = (a * Math.PI * 2) / ARMS;
        const pts: [number, number][] = [];
        for (let k = 0; k <= ARM_STEPS; k++) {
          const th = th0 + (k / ARM_STEPS) * (thEnd - th0);
          const r = pitch * th;
          pts.push([Math.cos(th + off) * r, Math.sin(th + off) * r]);
        }
        pushStrip(data, pts, (k) => k / ARM_STEPS);
      }
      armVerts = (ARM_STEPS + 1) * 2;

      // Ticks: short strokes across each arm, as separate quads.
      tickStart = data.length / STRIDE;
      for (let a = 0; a < ARMS; a++) {
        const off = (a * Math.PI * 2) / ARMS;
        for (let k = 0; k < TICKS_PER_ARM; k++) {
          const th = thBirth + ((k + 0.5) / TICKS_PER_ARM) * (thEnd - thBirth);
          const r = pitch * th;
          const cx = Math.cos(th + off) * r;
          const cy = Math.sin(th + off) * r;
          // Arm tangent at θ: d/dθ of (r cos, r sin).
          let tx = pitch * Math.cos(th + off) - r * Math.sin(th + off);
          let ty = pitch * Math.sin(th + off) + r * Math.cos(th + off);
          const l = Math.hypot(tx, ty) || 1;
          tx /= l;
          ty /= l;
          const len = 5;
          const p0: [number, number] = [cx - ty * len, cy + tx * len];
          const p1: [number, number] = [cx + ty * len, cy - tx * len];
          // Width direction is the tangent; two triangles per tick.
          const v = (p: [number, number], side: number) => [p[0], p[1], tx, ty, side, -1];
          data.push(...v(p0, -1), ...v(p0, 1), ...v(p1, -1));
          data.push(...v(p0, 1), ...v(p1, 1), ...v(p1, -1));
        }
      }
      tickVerts = data.length / STRIDE - tickStart;

      circStart = data.length / STRIDE;
      const circ: [number, number][] = [];
      const CS = 180;
      for (let k = 0; k <= CS; k++) {
        const t = (k / CS) * Math.PI * 2;
        circ.push([Math.cos(t) * CIRCLE * half, Math.sin(t) * CIRCLE * half]);
      }
      pushStrip(data, circ, () => -1);
      circVerts = data.length / STRIDE - circStart;

      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    };

    // ── Frame
    type Placed = {
      x: number;
      y: number;
      r: number;
      cw: number;
      ch: number;
      tex: number;
      soft: number;
      fade: number;
    };
    const placed: Placed[] = [];
    let raf = 0;
    let visible = true;
    let drift = 0;
    let lastNow = 0;
    const t0 = performance.now();
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, lift: 0, tLift: 0 };

    const frame = (now: number) => {
      raf = 0;
      if (!w || !h) return;
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : 0);
      lastNow = now;
      const burst = 1 + (BURST - 1) * (1 - easeOut(t / BURST_S));
      if (!still) drift += dt * LAPS_PER_SEC * burst;
      ptr.x += (ptr.tx - ptr.x) * 0.12;
      ptr.y += (ptr.ty - ptr.y) * 0.12;
      ptr.lift += (ptr.tLift - ptr.lift) * 0.08;

      // Fade + lift as the hero scrolls away; the root clips the stage.
      const scroll = window.scrollY;
      const leave = clamp01(scroll / (h * 0.95));
      st.style.opacity = String(1 - leave * 0.85);
      st.style.transform = `translate3d(0,${scroll * 0.35}px,0)`;

      const spin = still ? 0.4 : t * SPIN;
      const reveal = still ? 1e6 : easeOut(t / INTRO_S) * (half + 1.5 * cardH + WAVE_PX);
      const cycle = drift + scroll * SCRUB + 0.35;

      // Place cards along the arms.
      placed.length = 0;
      for (let a = 0; a < ARMS; a++) {
        const off = (a * Math.PI * 2) / ARMS;
        const desync = hash(a + 1) * 0.76;
        for (let k = 0; k < perArm; k++) {
          const slot = a * perArm + k;
          if (slot >= cardCount) break;
          const u = (k + desync) / perArm + cycle;
          const lap = Math.floor(u);
          const ph = u - lap;
          const id = slot * 7 + lap * 13;
          if (hash(id * 0.731) > DENSITY) continue;
          const th = thBirth + ph * (thEnd - thBirth);
          const r = pitch * th;
          const ang = th + off + spin;
          const wp = t * WOBBLE_HZ * Math.PI * 2;
          const x = Math.cos(ang) * r + WOBBLE_PX * Math.sin(wp + slot * 1.7);
          const y = Math.sin(ang) * r + WOBBLE_PX * Math.cos(wp * 0.8 + slot * 2.3);
          const rn = r / half;
          const scale = INNER + (1 - INNER) * smooth(0, 0.75, rn);
          const aspect = 1 + (ASPECTS[id % ASPECTS.length] - 1) * smooth(0.03, 0.3, rn);
          const ch = cardH * scale;
          const fade =
            smooth(0, 0.12, ph) * clamp01((reveal - r) / WAVE_PX) * (loadedAt[id % SCENES] >= 0 ? 1 : 0.6);
          if (fade <= 0.001) continue;
          placed.push({
            x,
            y,
            r,
            cw: ch * aspect,
            ch,
            tex: id % SCENES,
            soft: SOFT_MAX * (1 - smooth(BIRTH * SPAN * 0.5, SOFT_END, rn)),
            fade,
          });
        }
      }
      // Outer cards are bigger and read as nearer: draw them last.
      placed.sort((p, q) => p.r - q.r);

      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // Lines under the cards.
      gl.useProgram(line.prog);
      gl.bindVertexArray(lineVao);
      gl.uniform2f(line.u.uHalf, w / 2, h / 2);
      gl.uniform1f(line.u.uAngle, spin);
      gl.uniform3f(line.u.uInk, ...ink);
      gl.uniform1f(line.u.uReveal, reveal);
      gl.uniform1f(line.u.uWave, WAVE_PX);
      gl.uniform1f(line.u.uClock, still ? 0.5 : t * PULSE_RATE);
      gl.uniform1f(line.u.uWidth, 2);
      gl.uniform1f(line.u.uSwell, PULSE_SWELL_PX);
      gl.uniform1f(line.u.uAlpha, LINE_ALPHA);
      gl.uniform1f(line.u.uHotAlpha, PULSE_ALPHA);
      for (let a = 0; a < ARMS; a++) {
        gl.uniform3f(line.u.uHotColor, ...armColors[a]);
        gl.uniform1f(line.u.uLag, a * 0.618);
        gl.drawArrays(gl.TRIANGLE_STRIP, a * armVerts, armVerts);
      }
      gl.uniform1f(line.u.uSwell, 0);
      gl.uniform1f(line.u.uHotAlpha, 0);
      gl.uniform1f(line.u.uWidth, 1.4);
      gl.uniform1f(line.u.uAlpha, TICK_ALPHA);
      gl.drawArrays(gl.TRIANGLES, tickStart, tickVerts);
      gl.uniform1f(line.u.uAlpha, LINE_ALPHA * 0.6);
      gl.drawArrays(gl.TRIANGLE_STRIP, circStart, circVerts);

      // Cards.
      gl.useProgram(card.prog);
      gl.bindVertexArray(cardVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(card.u.uTex, 0);
      gl.uniform2f(card.u.uHalf, w / 2, h / 2);
      gl.uniform1f(card.u.uFocal, focal);
      gl.uniform1f(card.u.uBow, BOW_PX);
      gl.uniform3f(card.u.uPress, ptr.x, ptr.y, LIFT_PX * ptr.lift);
      gl.uniform1f(card.u.uRadius, CORNER_PX);
      gl.uniform1f(card.u.uSplit, SPLIT);
      gl.uniform1f(card.u.uRim, RIM_ALPHA);
      gl.uniform3f(card.u.uRimColor, ...ink);
      gl.uniform3f(card.u.uBase, ...base);
      const texAspect = TEX_W / TEX_H;
      for (const p of placed) {
        const aspect = p.cw / p.ch;
        // Cover-fit crop of the 16:9 frame into this card's shape.
        const sx = aspect < texAspect ? aspect / texAspect : 1;
        const sy = aspect < texAspect ? 1 : texAspect / aspect;
        const since = loadedAt[p.tex];
        gl.bindTexture(gl.TEXTURE_2D, textures[p.tex]);
        gl.uniform4f(card.u.uCrop, (1 - sx) / 2, (1 - sy) / 2, sx, sy);
        gl.uniform2f(card.u.uCenter, p.x, p.y);
        gl.uniform2f(card.u.uSize, p.cw, p.ch);
        gl.uniform1f(card.u.uSoft, p.soft);
        gl.uniform1f(card.u.uFade, p.fade);
        gl.uniform1f(card.u.uLoaded, since < 0 ? 0 : smooth(0, 400, now - since));
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }

      const settling = Math.abs(ptr.tLift - ptr.lift) > 0.002;
      if (visible && (!still || settling)) raf = requestAnimationFrame(frame);
    };

    function kick() {
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      const b = st!.getBoundingClientRect();
      ptr.tx = e.clientX - b.left - w / 2;
      ptr.ty = e.clientY - b.top - h / 2;
      const inside = e.clientY >= b.top && e.clientY <= b.bottom;
      ptr.tLift = inside ? 1 : 0;
      if (ptr.lift < 0.01) {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
      }
      kick();
    };
    const onLeave = () => {
      ptr.tLift = 0;
      kick();
    };

    readTheme();
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        lastNow = 0;
        kick();
      }
    });
    io.observe(el);
    // Theme colours transition, so read again once they have settled.
    let themeTimer = 0;
    const mo = new MutationObserver(() => {
      readTheme();
      kick();
      window.clearTimeout(themeTimer);
      themeTimer = window.setTimeout(() => {
        readTheme();
        kick();
      }, 450);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", kick, { passive: true });
    kick();

    return () => {
      disposed = true;
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(themeTimer);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", kick);
      if (raf) cancelAnimationFrame(raf);
      textures.forEach((tx) => gl.deleteTexture(tx));
      gl.deleteProgram(card.prog);
      gl.deleteProgram(line.prog);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div ref={stage} className="absolute inset-0">
        <canvas ref={canvas} className="absolute inset-0" />
      </div>
    </div>
  );
}
