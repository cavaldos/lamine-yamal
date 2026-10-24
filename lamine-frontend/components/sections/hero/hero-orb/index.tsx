"use client";

import { useEffect, useRef } from "react";
import { sceneArtMarkup } from "./scene-art";
import { currentScroll, subscribeScroll } from "@/components/layout/smooth-scroll";
import { ARMS, TURNS, SPAN, BIRTH, MAX_CARDS, CARDS_PER_MPX, DENSITY, CARD_H, INNER, ASPECTS, LAPS_PER_SEC, SPIN, SCRUB, WOBBLE_PX, WOBBLE_HZ, FOV, BOW_PX, LIFT_PX, CORNER_PX, SPLIT, SOFT_MAX, SOFT_END, RIM_ALPHA, LINE_ALPHA, TICK_ALPHA, TICKS_PER_ARM, CIRCLE, PULSE_RATE, PULSE_ALPHA, PULSE_SWELL_PX, INTRO_S, BURST, BURST_S, WAVE_PX, SCENES, TEX_W, TEX_H, GRID } from "./config";
import { clamp01, smooth, easeOut, hash, rgbToHsl, hslToRgb, compile, STRIDE, pushStrip, type RGB } from "./gl-utils";
import { CARD_VS, CARD_FS, LINE_VS, LINE_FS } from "./shaders";

// A slow spiral galaxy of photos. Cards are born small and soft at the
// centre, then drift outward along six arms, growing and sharpening as they go.
// Everything is drawn with raw WebGL2: each card is a pillow-curved quad seen
// through a real perspective, so cards near the screen edge bow visibly.

export default function HeroOrb({ images = [] }: { images?: string[] }) {
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
    // One texture per photo, or the generated set when there are none.
    const scenes = images.length || SCENES;
    const loadedAt = new Float32Array(scenes).fill(-1);
    for (let i = 0; i < scenes; i++) {
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
        // Remote photos (e.g. YouTube thumbnails) must be CORS-clean to upload to WebGL.
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.onload = () => {
          if (disposed || !sctx) return resolve();
          sctx.clearRect(0, 0, TEX_W, TEX_H);
          // Cover-fit any photo into the 16:9 texture instead of stretching it.
          const iw = img.naturalWidth || TEX_W;
          const ih = img.naturalHeight || TEX_H;
          const k = Math.max(TEX_W / iw, TEX_H / ih);
          sctx.drawImage(img, (TEX_W - iw * k) / 2, (TEX_H - ih * k) / 2, iw * k, ih * k);
          gl.bindTexture(gl.TEXTURE_2D, textures[i]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
          gl.generateMipmap(gl.TEXTURE_2D);
          loadedAt[i] = performance.now();
          kick();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = images.length
          ? images[i % images.length]
          : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneArtMarkup(i * 3 + 1))}`;
      });
    // One at a time keeps the main thread smooth during the intro.
    (async () => {
      for (let i = 0; i < scenes && !disposed; i++) await loadScene(i);
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
      // Blaugrana arms: blue, garnet, blue, garnet… with one gold arm.
      const club = [
        readColor("--accent", [0.24, 0.42, 1]),
        readColor("--garnet", [0.82, 0.08, 0.35]),
        readColor("--gold", [0.96, 0.77, 0.19]),
      ];
      armColors = Array.from({ length: ARMS }, (_, a) => {
        const [h, s, l] = rgbToHsl(club[a === ARMS - 1 ? 2 : a % 2]);
        return hslToRgb([h, Math.min(1, s * 0.95), Math.min(0.62, l)]);
      });
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

    // Fade + lift as the hero scrolls away; the root clips the stage.
    const applyScroll = (scroll: number) => {
      const leave = clamp01(scroll / (h * 0.95));
      st.style.opacity = String(1 - leave * 0.85);
      st.style.transform = `translate3d(0,${scroll * 0.35}px,0)`;
    };

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

      const scroll = currentScroll();
      applyScroll(scroll);

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
            smooth(0, 0.12, ph) * clamp01((reveal - r) / WAVE_PX) * (loadedAt[id % scenes] >= 0 ? 1 : 0.6);
          if (fade <= 0.001) continue;
          placed.push({
            x,
            y,
            r,
            cw: ch * aspect,
            ch,
            tex: id % scenes,
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
    // The stage moves in Lenis's frame; the cards redraw on the next one.
    const unsubscribe = subscribeScroll((y) => {
      if (!visible || !h) return;
      applyScroll(y);
      kick();
    });
    kick();

    return () => {
      disposed = true;
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(themeTimer);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
      textures.forEach((tx) => gl.deleteTexture(tx));
      gl.deleteProgram(card.prog);
      gl.deleteProgram(line.prog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- images are a static list
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div ref={stage} className="absolute inset-0 will-change-[transform,opacity]">
        <canvas ref={canvas} className="absolute inset-0" />
      </div>
    </div>
  );
}
