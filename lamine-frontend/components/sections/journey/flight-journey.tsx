"use client";

import { useEffect, useMemo, useRef } from "react";
import { currentScroll, scrollToY, subscribeScroll } from "@/components/layout/smooth-scroll";
import { createMotes, drawFloor, readFloorColors, type FloorColors } from "@/components/sections/journey/floor";
import Station from "@/components/sections/journey/station";
import {
  camera,
  clamp01,
  DEPTH,
  FIT_PAD,
  N,
  NAV_H,
  PERSPECTIVE,
  place,
  progressForStation,
  SECTION_HEIGHT,
} from "@/components/sections/journey/world";
import YearRail from "@/components/sections/journey/year-rail";
import { chaptersFor } from "@/lib/content";
import { useDict } from "@/lib/i18n/provider";
import { sectionMeta } from "@/lib/sections";

// The pinned 3D flight. Per-frame work writes styles directly (no React state)
// and runs inside Lenis's frame via subscribeScroll.
export default function FlightJourney() {
  const section = useRef<HTMLElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stations = useRef<(HTMLDivElement | null)[]>([]);
  const fits = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const dateOut = useRef<HTMLSpanElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const dots = useRef<(HTMLLIElement | null)[]>([]);
  const dict = useDict();
  const meta = sectionMeta(dict, "journey");
  const chapters = useMemo(() => chaptersFor(dict), [dict]);

  useEffect(() => {
    const sec = section.current;
    const vp = view.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!sec || !vp || !cv || !ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let active = -1;
    // Layout is measured on resize only, never inside a scroll frame.
    let secTop = 0;
    let travel = 1;
    // Last values written per station, so unchanged styles are not rewritten.
    const last = chapters.map(() => ({ t: "", o: "", v: "", p: "" }));
    let colors: FloorColors = { line: "#fff", accent: "#3d6bff", garnet: "#d1155a", gold: "#f4c430" };
    const motes = createMotes();
    const readColors = () => {
      colors = readFloorColors(colors);
    };

    const resize = () => {
      w = vp.clientWidth;
      h = vp.clientHeight;
      secTop = sec.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, sec.offsetHeight - h);
      // The floor is soft and dim; full retina resolution buys nothing here.
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      // A card taller than the room between the HUD and the hint (a short phone,
      // a long translation) is scaled down to fit instead of being cut off.
      const room = h - 2 * FIT_PAD;
      fits.current.forEach((el) => {
        if (!el) return;
        const s = Math.min(1, room / el.offsetHeight);
        el.style.transform = s < 1 ? `scale(${s.toFixed(3)})` : "";
      });
      readColors();
      schedule();
    };

    const frame = (y = currentScroll()) => {
      const p = clamp01((y + NAV_H - secTop) / travel);
      const cam = camera(p);

      stations.current.forEach((el, i) => {
        if (!el) return;
        const d = i - cam;
        const { transform, opacity } = place(i, d);
        const o = opacity.toFixed(3);
        const v = opacity < 0.01 ? "hidden" : "visible";
        const pe = Math.abs(d) < 0.4 ? "auto" : "none";
        const prev = last[i];
        // Hidden stations stay parked; nothing about them needs to change.
        if (v === "hidden" && prev.v === "hidden") return;
        if (transform !== prev.t) el.style.transform = prev.t = transform;
        if (o !== prev.o) el.style.opacity = prev.o = o;
        if (v !== prev.v) el.style.visibility = prev.v = v;
        if (pe !== prev.p) el.style.pointerEvents = prev.p = pe;
      });

      drawFloor(ctx, { w, h, dpr, camZ: cam * DEPTH, colors, motes });

      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (hint.current) {
        const ho = 1 - clamp01(p * 30);
        hint.current.style.opacity = String(ho);
        // Once it has faded out, stop the pulse instead of animating something invisible.
        hint.current.toggleAttribute("data-offscreen", ho < 0.01);
      }

      const now = Math.round(cam);
      if (now !== active) {
        active = now;
        if (counter.current) counter.current.textContent = String(now + 1).padStart(2, "0");
        if (dateOut.current) dateOut.current.textContent = chapters[now].date;
        dots.current.forEach((dot, i) => dot?.setAttribute("data-active", String(i === now)));
      }
    };

    // For resizes and theme changes; scrolling calls frame() directly.
    const schedule = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          frame();
        });
    };

    // Only track scroll while the world is near the screen.
    let live = false;
    const io = new IntersectionObserver(
      ([e]) => {
        live = e.isIntersecting;
        // Pause the hint's pulse while the world is far off screen.
        sec.toggleAttribute("data-offscreen", !live);
        if (live) schedule();
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(sec);
    const unsubscribe = subscribeScroll((y) => {
      if (live) frame(y);
    });

    // Anything above the section changing height moves it, so watch the page too.
    const ro = new ResizeObserver(resize);
    ro.observe(vp);
    ro.observe(document.body);
    // Cards change height as fonts load; scaling them does not, so this cannot loop.
    fits.current.forEach((el) => el && ro.observe(el));
    const mo = new MutationObserver(() => {
      readColors();
      schedule();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();

    return () => {
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chapters]);

  const jump = (i: number) => {
    const sec = section.current;
    const vp = view.current;
    if (!sec || !vp) return;
    const top = sec.getBoundingClientRect().top + window.scrollY - NAV_H;
    scrollToY(top + progressForStation(i) * (sec.offsetHeight - vp.clientHeight));
  };

  return (
    <section
      id="journey"
      ref={section}
      aria-label={meta.label}
      className="relative"
      style={{ height: SECTION_HEIGHT }}
    >
      <div
        ref={view}
        className="sticky top-12 h-[calc(100svh-3rem)] overflow-hidden border-b border-line bg-bg-sunken"
      >
        {/* Horizon glow */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_50%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_70%),radial-gradient(30%_22%_at_50%_50%,color-mix(in_srgb,var(--garnet)_22%,transparent),transparent_70%)]"
        />
        <canvas ref={canvas} aria-hidden className="absolute inset-0" />

        {chapters.map((ch, i) => {
          const initial = place(i, i);
          return (
            <div
              key={i}
              className="pointer-events-none absolute inset-0 grid place-items-center px-4"
              style={{ perspective: `${PERSPECTIVE}px`, zIndex: N - i }}
            >
              <div
                ref={(el) => {
                  stations.current[i] = el;
                }}
                className="world-station w-full max-w-[880px]"
                style={{
                  transform: initial.transform,
                  opacity: initial.opacity,
                  visibility: initial.opacity < 0.01 ? "hidden" : "visible",
                  pointerEvents: i === 0 ? "auto" : "none",
                }}
              >
                <div
                  ref={(el) => {
                    fits.current[i] = el;
                  }}
                >
                  <Station chapter={ch} index={i} />
                </div>
              </div>
            </div>
          );
        })}

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 border-b border-line bg-bg/75 px-4 py-3 sm:px-6 md:px-10">
          <p className="hud-label whitespace-nowrap text-muted">
            <span className="text-faint">{meta.num}</span>
            <span aria-hidden className="mx-2 text-faint">
              /
            </span>
            {meta.label}
          </p>
          {/* Narrow screens drop the word "Chapter", then the date (each card shows its own). */}
          <p className="hud-label whitespace-nowrap text-faint">
            <span className="hidden min-[360px]:inline">{dict.journey.chapter} </span>
            <span ref={counter} className="text-ink">01</span> / {String(N).padStart(2, "0")}
            <span className="hidden sm:inline">
              <span className="mx-2">·</span>
              <span ref={dateOut} className="text-garnet-ink">
                {chapters[0].date}
              </span>
            </span>
          </p>
        </div>

        <YearRail
          onJump={jump}
          itemRef={(i, el) => {
            dots.current[i] = el;
          }}
        />

        <p
          ref={hint}
          className="hud-label pointer-events-none absolute bottom-6 left-1/2 z-[60] w-max max-w-[calc(100%-2rem)] -translate-x-1/2 text-center text-muted md:bottom-8"
        >
          <span className="inline-block animate-pulse">{dict.journey.scrollHint}</span>
        </p>

        <div className="absolute inset-x-0 bottom-0 z-[60] h-[3px] bg-line">
          <span
            ref={bar}
            className="block h-full origin-left bg-linear-to-r from-accent via-garnet to-gold"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}
