// Math, colour and WebGL helpers for the hero spiral.

export type RGB = [number, number, number];

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function rgbToHsl([r, g, b]: RGB): RGB {
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

export function hslToRgb([h, s, l]: RGB): RGB {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

export function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
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
export const STRIDE = 6;

export function pushStrip(
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

// Pass photo URLs (same-origin, or remote hosts that send CORS headers) to fill the cards with
// real pictures; cards without one fall back to a generated still.
