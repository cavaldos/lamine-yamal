"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDict } from "@/lib/i18n/provider";
import { sectionsFor } from "@/lib/sections";
import { currentScroll, scrollToEl, scrollToY, subscribeScroll } from "@/components/layout/smooth-scroll";

const NAV_H = 48;
const RAIL_W = 60;
const EDGE_PAD = 12;
const FS = 34; // size of the current section's word
const SMALL_PX = 16; // size of every other word in the stacks
const RIDING_PX = 22; // size of the word riding the rail
const ROW = 20; // row spacing in both stacks
const TOP_Y = NAV_H + 27; // first row of the top stack
const BIG_GAP = 26; // extra drop for the current (large) word
const BOTTOM_PAD = 37; // last row of the bottom stack, from the viewport bottom
const ENTER_ZONE = 240; // px of travel from bottom stack onto the rail
const FLIP_ZONE = 260; // px of travel between riding and stacked
const STAGGER = 0.14; // per-letter delay fraction, trailing letters lead
const RIDE_ZONE = 0.35; // fraction of viewport where word rides before flip starts

const TICKS = Array.from({ length: 101 }, (_, i) => ({ pct: i, major: i % 5 === 0 }));

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Frosted panel feathers inward from the outer (right) edge.
const FROST = (() => {
  const stops = ["black 40%"];
  for (let i = 1; i < 8; i++) {
    const x = i / 8;
    stops.push(`rgba(0,0,0,${Math.pow(1 - x, 2.2).toFixed(3)}) ${(40 + x * 60).toFixed(1)}%`);
  }
  stops.push("transparent 100%");
  return `linear-gradient(to left, ${stops.join(", ")})`;
})();

type Metrics = { adv: number[]; cum: number[]; total: number };

export default function Ruler() {
  const dict = useDict();
  // Rail words follow the page order in lib/sections.ts, in the page's language.
  const SECTIONS = useMemo(() => sectionsFor(dict).map((s) => ({ id: s.id, label: s.nav.toUpperCase() })), [dict]);
  const [mode, setMode] = useState<"full" | "static" | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const ticks = useRef<(HTMLSpanElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const bracket = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[][]>(SECTIONS.map(() => []));
  const digits = useRef<(HTMLSpanElement | null)[]>([]);

  // MatchMedia gating: desktop pointer only, reduced motion degrades to a plain list.
  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const fine = window.matchMedia("(pointer: fine) and (hover: hover) and (min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => setMode(!mobile && fine.matches ? (motion.matches ? "full" : "static") : null);
    sync();
    fine.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (mode !== "full") return;

    const metrics: Metrics[] = SECTIONS.map(() => ({ adv: [], cum: [], total: 0 }));
    let docH = 0;
    let vw = 0;
    let vh = 0;
    let zoom = 0;
    let zoomTarget = 0;
    let hover = false;
    let pending = 0;
    let prevPct = -1;
    let zoomReset = false;
    let readoutTop = "";
    let bracketH = "";
    // Section tops in page coordinates, measured on resize so the scroll frame
    // never has to read layout.
    let tops: number[] = SECTIONS.map(() => 0);
    // The riding words are only shown on very wide screens (see the CSS gate below).
    const wide = window.matchMedia("(min-width: 1680px)");
    const big: number[] = SECTIONS.map(() => 0);

    const measure = () => {
      docH = document.documentElement.scrollHeight;
      vw = window.innerWidth;
      vh = window.innerHeight;
      // Tick rows use percentage tops, so the strip needs the document height.
      if (strip.current) strip.current.style.height = `${docH}px`;
      tops = SECTIONS.map((sec) => {
        const el = document.getElementById(sec.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      });
      SECTIONS.forEach((_, i) => {
        const els = letters.current[i];
        const m = metrics[i];
        m.adv = els.map((el) => el?.offsetWidth ?? 0);
        m.cum = [];
        let acc = 0;
        for (const w of m.adv) {
          m.cum.push(acc);
          acc += w;
        }
        m.total = acc;
      });
    };

    const schedule = () => {
      if (!pending)
        pending = requestAnimationFrame(() => {
          pending = 0;
          frame();
        });
    };

    const frame = (scrollY = currentScroll()) => {
      const f = clamp01(scrollY / Math.max(1, docH - vh));
      const base = NAV_H + EDGE_PAD;
      const span = Math.max(1, vh - NAV_H - 2 * EDGE_PAD);
      const drift = base - f * (NAV_H + 2 * EDGE_PAD);

      strip.current?.style.setProperty("transform", `translate3d(0,${-scrollY + drift}px,0)`);

      // Needle + odometer
      const needleY = base + f * span;
      if (needle.current) {
        needle.current.style.transform = `translate3d(0,${needleY}px,0)`;
        needle.current.style.opacity = String(clamp01(f / 0.03));
        const above = needleY > vh - 26 ? "-14px" : "4px";
        if (readout.current && above !== readoutTop) readout.current.style.top = readoutTop = above;
      }

      const pct = Math.round(100 * f);
      if (pct !== prevPct) {
        prevPct = pct;
        root.current?.setAttribute("aria-valuenow", String(pct));
        const str = String(pct).padStart(3, "0");
        digits.current.forEach((el, i) => {
          if (el) el.style.transform = `translateY(${-(str.charCodeAt(i) - 48)}em)`;
        });
      }

      // Hover zoom: the rail collapses into a whole-page map.
      zoomTarget = hover ? 1 : 0;
      zoom += (zoomTarget - zoom) * 0.18;
      if (zoomTarget === 0 && zoom < 0.001) zoom = 0;
      if (zoomTarget === 1 && zoom > 0.999) zoom = 1;

      if (bracket.current) {
        bracket.current.style.transform = `translate3d(0,${base + (scrollY / docH) * span}px,0)`;
        const bh = `${Math.max(28, (vh / docH) * span)}px`;
        if (bh !== bracketH) bracket.current.style.height = bracketH = bh;
        // Only shown while the rail is hovered.
        bracket.current.style.opacity = String(zoom);
      }
      if (ghost.current) {
        ghost.current.style.opacity = String(hover ? 0.2 + 0.8 * zoom : 0);
      }

      if (zoom > 0) {
        TICKS.forEach((t, i) => {
          const yNear = (t.pct / 100) * docH - scrollY + drift;
          const yMap = base + (t.pct / 100) * span;
          rows.current[i]?.style.setProperty("transform", `translate3d(0,${zoom * (yMap - yNear)}px,0)`);
          const lbl = labels.current[i];
          if (lbl) lbl.style.opacity = String(0.5 * (1 - zoom));
        });
      } else if (!zoomReset) {
        TICKS.forEach((_, i) => {
          rows.current[i]?.style.removeProperty("transform");
          const lbl = labels.current[i];
          if (lbl) lbl.style.opacity = "0.5";
        });
        zoomReset = true;
      }
      if (zoom > 0) zoomReset = false;

      if (!wide.matches) {
        if (zoom !== zoomTarget) schedule();
        return;
      }

      // Section words. Upcoming sections wait small in a stack at the bottom right.
      // As a section scrolls in, its word climbs onto the rail (rotated), then
      // flips into the top-right stack. The current section's word is large.
      const right = vw - RAIL_W;
      const n = SECTIONS.length;
      const flips = SECTIONS.map((_, i) => {
        const top = tops[i] - scrollY;
        if (i === 0) {
          // The hero has the wordmark itself; its word only fades into the top stack.
          const l = ease(clamp01((scrollY - vh * 0.25) / (vh * 0.35)));
          return { u: 1, l, top };
        }
        return {
          u: ease(clamp01((vh - 40 - top) / ENTER_ZONE)),
          l: clamp01((vh * RIDE_ZONE - top) / FLIP_ZONE),
          top,
        };
      });
      let current = -1;
      flips.forEach((f, i) => {
        if (f.l >= 0.5) current = i;
      });
      let settling = false;

      SECTIONS.forEach((_, i) => {
        const m = metrics[i];
        const els = letters.current[i];
        if (!m.total) return;
        const { u, l: rawL, top } = flips[i];
        const target = i === current ? 1 : 0;
        big[i] += (target - big[i]) * 0.2;
        if (Math.abs(target - big[i]) > 0.002) settling = true;
        else big[i] = target;

        const sSmall = SMALL_PX / FS;
        const sRide = RIDING_PX / FS;
        const sTop = sSmall + (1 - sSmall) * big[i];
        const yTop = TOP_Y + i * ROW + BIG_GAP * big[i];
        const yBottom = vh - BOTTOM_PAD - (n - 1 - i) * ROW;
        const len = m.total * sRide;
        const yRail = Math.min(Math.max(top + len / 2 + 8, NAV_H + 20 + len / 2), vh - 20 - len / 2);
        const count = els.length;
        const tone = 0.5 + 0.5 * big[i];

        els.forEach((s, li) => {
          if (!s) return;
          const off = m.cum[li] + m.adv[li] / 2;
          // Stage 1: bottom stack → rail.
          const bx = right - (m.total - off) * sSmall;
          const rx = vw - RAIL_W / 2;
          const ry = yRail + (m.total / 2 - off) * sRide;
          const hx = bx + (rx - bx) * u;
          const hy = yBottom + (ry - yBottom) * u;
          const hRot = -90 * u;
          const hScale = sSmall + (sRide - sSmall) * u;
          // Stage 2: rail → top stack. Trailing letters lead, so the word unfurls end-first.
          const o = count - 1 - li;
          const k = i === 0 ? 1 : ease(clamp01(ease(rawL) * (1 + STAGGER * (count - 1)) - o * STAGGER));
          const mx = right - (m.total - off) * sTop;
          const my = yTop;
          const cx = (hx + mx) / 2 - 32;
          const cy = (hy + my) / 2 - 10;
          const b = 1 - k;
          const x = b * b * hx + 2 * b * k * cx + k * k * mx;
          const y = b * b * hy + 2 * b * k * cy + k * k * my;
          const rot = hRot * (1 - k);
          const scale = hScale + (sTop - hScale) * k;
          s.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`;
          s.style.opacity = String(i === 0 ? rawL * tone : tone);
        });
      });
      if (settling || zoom !== zoomTarget) schedule();
    };

    const onResize = () => {
      measure();
      schedule();
    };
    const setHover = (v: boolean) => () => {
      hover = v;
      schedule();
    };
    const onEnter = setHover(true);
    const onLeave = setHover(false);
    const onMove = (e: PointerEvent) => {
      if (hover) ghost.current?.style.setProperty("transform", `translate3d(0,${e.clientY}px,0)`);
    };
    const onClick = (e: MouseEvent) => {
      const base = NAV_H + EDGE_PAD;
      const span = Math.max(1, vh - NAV_H - 2 * EDGE_PAD);
      const t = clamp01((e.clientY - base) / span);
      scrollToY(t * Math.max(1, docH - vh));
    };

    measure();
    const rail = root.current;
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    // Runs inside Lenis's frame, in step with the page.
    const unsubscribe = subscribeScroll((y) => frame(y));
    wide.addEventListener("change", onResize);
    window.addEventListener("resize", onResize);
    rail?.addEventListener("pointerenter", onEnter);
    rail?.addEventListener("pointerleave", onLeave);
    rail?.addEventListener("pointermove", onMove);
    rail?.addEventListener("click", onClick);
    frame();

    return () => {
      ro.disconnect();
      unsubscribe();
      wide.removeEventListener("change", onResize);
      window.removeEventListener("resize", onResize);
      rail?.removeEventListener("pointerenter", onEnter);
      rail?.removeEventListener("pointerleave", onLeave);
      rail?.removeEventListener("pointermove", onMove);
      rail?.removeEventListener("click", onClick);
      if (pending) cancelAnimationFrame(pending);
    };
  }, [mode, SECTIONS]);

  if (!mode) return null;

  if (mode === "static") {
    return (
      <nav aria-label={dict.nav.sections} className="fixed right-[72px] bottom-9 z-40 flex flex-col items-end gap-1.5">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="font-display text-ink hover:text-accent-ink"
            style={{ fontSize: 16 }}
          >
            {s.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <>
      {/* Rail: whole-page tick strip + scroll needle */}
      <div
        ref={root}
        role="scrollbar"
        aria-label={dict.nav.pagePosition}
        aria-controls="main"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="fixed inset-y-0 right-0 z-40 w-[60px] cursor-crosshair overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg) 82%, transparent)",
            maskImage: FROST,
            WebkitMaskImage: FROST,
          }}
        />

        <div ref={strip} aria-hidden className="absolute inset-x-0 top-0 will-change-transform">
          {TICKS.map((t, i) => (
            <div
              key={t.pct}
              ref={(el) => {
                rows.current[i] = el;
              }}
              className="absolute inset-x-0 h-0"
              style={{ top: `${t.pct}%` }}
            >
              <span
                ref={(el) => {
                  ticks.current[i] = el;
                }}
                className="ruler-tick absolute right-0 block h-px bg-ink"
                style={{
                  width: t.major ? 20 : 10,
                  opacity: t.major ? 0.8 : 0.4,
                  animationDelay: `${i * 10}ms`,
                }}
              />
              {t.major && (
                <span
                  ref={(el) => {
                    labels.current[i] = el;
                  }}
                  className="absolute top-0 -translate-y-1/2 font-mono text-ink"
                  style={{ right: 24, fontSize: 9, letterSpacing: "0.08em", opacity: 0.5 }}
                >
                  {t.pct}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Visible-page bracket, fades in on hover */}
        <div ref={bracket} aria-hidden className="absolute inset-y-0 right-0 w-[7px] opacity-0">
          <div className="absolute inset-0 rounded-full bg-ink" style={{ opacity: 0.35 }} />
        </div>

        {/* Needle + odometer readout */}
        <div ref={needle} aria-hidden className="absolute inset-x-0 top-0 h-0 opacity-0 will-change-transform">
          <span className="absolute inset-x-0 block h-px bg-accent" style={{ boxShadow: "0 0 6px var(--accent)" }} />
          <span
            ref={readout}
            className="absolute right-2 top-1 font-mono whitespace-nowrap text-accent-ink"
            style={{ fontSize: 9, letterSpacing: "0.08em" }}
          >
            <span className="ruler-digits">
              {[0, 1, 2].map((col) => (
                <span
                  key={col}
                  ref={(el) => {
                    digits.current[col] = el;
                  }}
                  className="ruler-digit-col"
                >
                  {"0123456789".split("").map((ch) => (
                    <span key={ch}>{ch}</span>
                  ))}
                </span>
              ))}
            </span>
            <span style={{ marginLeft: 2 }}>%</span>
          </span>
        </div>
      </div>

      {/* Hover ghost line */}
      <div ref={ghost} aria-hidden className="pointer-events-none fixed inset-y-0 right-0 z-40 h-0 opacity-0">
        <div className="absolute right-0 block h-[3px] w-[60px] bg-ink" />
      </div>

      {/* Section letters riding the rail — only where the margin is wide enough
          that they don't sit on top of the content. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40 hidden min-[1680px]:block">
        {SECTIONS.map((sec, i) =>
          sec.label.split("").map((ch, li) => (
            <span
              key={`${sec.id}-${li}`}
              ref={(el) => {
                letters.current[i][li] = el;
              }}
              onClick={(e) => {
                e.preventDefault();
                scrollToEl(document.getElementById(sec.id));
              }}
              className="font-display pointer-events-auto absolute top-0 left-0 cursor-pointer whitespace-pre text-ink-strong opacity-0"
              style={{
                fontSize: FS,
                lineHeight: 1,
                textShadow: "0 0 4px var(--bg), 0 0 10px var(--bg)",
                willChange: "transform, opacity, color",
              }}
            >
              {ch}
            </span>
          )),
        )}
      </div>
    </>
  );
}
