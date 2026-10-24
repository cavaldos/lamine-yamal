"use client";

import { useEffect, useRef } from "react";
import { ARCHIVE_PHOTOS } from "@/lib/content";
import PhotoFrame from "@/components/ui/photo-frame";
import { currentScroll, subscribeScroll } from "@/components/layout/smooth-scroll";

const NAV_H = 48;
const PARALLAX = 0.06; // how far each photo's year drifts against the track

// Vertical scroll drives a horizontal film strip. The section is as tall as the
// strip is wide, so one pixel of scroll moves the strip one pixel.
export default function PhotoReel() {
  const section = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sec = section.current;
    const vp = view.current;
    const tr = track.current;
    if (!sec || !vp || !tr) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion: a plain swipeable strip, no pinning.
      sec.style.height = "auto";
      vp.style.position = "relative";
      vp.style.height = "auto";
      vp.style.overflowX = "auto";
      return;
    }

    let travel = 0;
    let raf = 0;
    let secTop = 0;
    let mid = 0;
    let live = false;
    const frames = Array.from(tr.querySelectorAll<HTMLElement>("[data-parallax]"));
    // Untransformed centre of each card, relative to the pinned viewport.
    let centers: number[] = [];

    const measure = () => {
      travel = Math.max(0, tr.scrollWidth - vp.clientWidth);
      centers = frames.map((el) => {
        const li = el.closest("li")!;
        return li.offsetLeft + li.offsetWidth / 2;
      });
      mid = vp.clientWidth / 2;
      sec.style.height = `${vp.clientHeight + travel}px`;
      secTop = sec.getBoundingClientRect().top + window.scrollY;
      schedule();
    };

    // Pure function of the scroll position: no layout reads in here.
    const frame = (y = currentScroll()) => {
      const p = travel ? Math.min(1, Math.max(0, (y + NAV_H - secTop) / travel)) : 0;
      tr.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      frames.forEach((el, i) => {
        const offset = centers[i] - p * travel - mid;
        el.style.transform = `translate3d(${(offset * PARALLAX).toFixed(1)}px,0,0)`;
      });
    };

    const schedule = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          frame();
        });
    };

    const io = new IntersectionObserver(
      ([e]) => {
        live = e.isIntersecting;
        if (live) schedule();
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(sec);
    const unsubscribe = subscribeScroll((y) => {
      if (live) frame(y);
    });
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    ro.observe(tr);
    ro.observe(document.body);
    measure();
    return () => {
      io.disconnect();
      ro.disconnect();
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={section} className="relative" style={{ height: "300svh" }}>
      <div ref={view} className="sticky top-12 flex h-[calc(100svh-3rem)] flex-col justify-center overflow-hidden">
        <div className="px-6 pb-8 md:px-10">
          <p className="hud-label text-faint">Cuộn để lật album ↓</p>
        </div>
        <ol ref={track} className="flex w-max gap-4 px-6 will-change-transform md:gap-6 md:px-10">
          {ARCHIVE_PHOTOS.map((ph, i) => (
            <li key={i} className="w-[72vw] shrink-0 sm:w-[40vw] lg:w-[min(24vw,380px)]">
              <figure className="border border-line bg-bg">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {/* Oversized and shifted against the strip for depth. */}
                  <div data-parallax className="absolute -inset-x-[12%] inset-y-0 will-change-transform">
                    <PhotoFrame src={ph.src} alt={ph.caption} year={ph.year} tag={false} className="h-full w-full" />
                  </div>
                  {!ph.src && (
                    <span className="hud-label absolute top-3 left-3 border border-line-strong bg-bg/80 px-2 py-1 text-muted">
                      Ảnh demo
                    </span>
                  )}
                </div>
                <figcaption className="flex items-baseline justify-between gap-4 border-t border-line px-4 py-3">
                  <span className="text-[15px] leading-snug text-ink">{ph.caption}</span>
                  <span className="hud-label shrink-0 text-garnet-ink">{ph.year}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <div className="mx-6 mt-8 h-px bg-line md:mx-10">
          <span ref={bar} className="block h-full origin-left bg-linear-to-r from-accent to-garnet" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}
