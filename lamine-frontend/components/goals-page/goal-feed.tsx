"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll } from "@/components/layout/smooth-scroll";
import FeedRail from "@/components/goals-page/feed-rail";
import GoalFacts from "@/components/goals-page/goal-facts";
import Poster from "@/components/goals-page/poster";
import { useGoalPlayer } from "@/components/goals-page/use-goal-player";
import { ChevronDown, ChevronUp, X } from "@/components/ui/icons";
import { goalVideo, type Goal } from "@/lib/goals";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";

// Normal mode: one goal per screen, swipe or scroll to the next, like TikTok.
//
// Every slide shows a poster; a single YouTube player floats above the slide the
// feed has settled on. While the feed moves the player hides and pauses, then
// it jumps to the new slide and loads that clip — one iframe for the whole feed.
export default function GoalFeed({
  goals,
  start,
  onClose,
  onFilm,
}: {
  goals: Goal[];
  start: number;
  onClose: () => void;
  onFilm: (index: number) => void;
}) {
  const dict = useDict();
  const t = dict.goalsPage;
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const medias = useRef<(HTMLDivElement | null)[]>([]);
  const loaded = useRef(-1); // slide whose clip is in the player
  const moving = useRef(false);
  const [active, setActive] = useState(start);
  const [still, setStill] = useState(false); // feed has settled on `active`

  // Destructured: the hook also returns a ref (host), and render may only read plain values.
  const { host, started, muted, load, play, pause, toggle, restart, seek, setMuted } = useGoalPlayer({
    // Loop the clip, like a short-video app.
    onEnded: () => restart(),
    onFrame: (p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    },
  });

  // Lay the player exactly over slide i's poster.
  const place = useCallback((i: number) => {
    const m = medias.current[i];
    const l = layer.current;
    if (!m || !l) return;
    const r = m.getBoundingClientRect();
    l.style.transform = `translate(${r.left}px, ${r.top}px)`;
    l.style.width = `${r.width}px`;
    l.style.height = `${r.height}px`;
  }, []);

  const settle = useCallback(
    (i: number) => {
      moving.current = false;
      place(i);
      setActive(i);
      setStill(true);
      if (loaded.current !== i) {
        loaded.current = i;
        if (bar.current) bar.current.style.transform = "scaleX(0)";
        load(goalVideo(goals[i]));
      } else play();
    },
    [goals, load, play, place],
  );

  const go = useCallback(
    (i: number) => {
      const s = scroller.current;
      if (!s || i < 0 || i >= goals.length) return;
      s.scrollTo({ top: i * s.clientHeight, behavior: "smooth" });
    },
    [goals.length],
  );

  // Open as a modal, freeze the page behind, start at the chosen goal.
  useEffect(() => {
    const d = dialog.current;
    const s = scroller.current;
    if (!d || !s) return;
    if (!d.open) d.showModal();
    lockScroll(true);
    s.scrollTop = start * s.clientHeight;
    settle(start);
    return () => lockScroll(false);
    // Runs once per opening; `start` is only the first slide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrolling: hide and pause the player at once, settle when the snap lands.
  useEffect(() => {
    const s = scroller.current;
    if (!s) return;
    let timer = 0;
    const land = () => {
      const h = s.clientHeight;
      const i = Math.round(s.scrollTop / h);
      // Still gliding into place: look again shortly.
      if (Math.abs(s.scrollTop - i * h) > 2) {
        timer = window.setTimeout(land, 80);
        return;
      }
      if (moving.current || loaded.current !== i) settle(i);
    };
    const onScroll = () => {
      const h = s.clientHeight;
      if (!moving.current && Math.abs(s.scrollTop - loaded.current * h) > 6) {
        moving.current = true;
        setStill(false);
        pause();
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(land, 140);
    };
    const onEnd = () => {
      window.clearTimeout(timer);
      land();
    };
    s.addEventListener("scroll", onScroll, { passive: true });
    s.addEventListener("scrollend", onEnd);

    // Keep the snap and the player in line when the window changes size.
    const ro = new ResizeObserver(() => {
      if (loaded.current < 0) return;
      s.scrollTop = loaded.current * s.clientHeight;
      place(loaded.current);
    });
    ro.observe(s);

    return () => {
      window.clearTimeout(timer);
      s.removeEventListener("scroll", onScroll);
      s.removeEventListener("scrollend", onEnd);
      ro.disconnect();
    };
  }, [pause, place, settle]);

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea")) return;
    const k = e.key;
    if (k === "ArrowDown" || k === "PageDown" || k === "j") go(active + 1);
    else if (k === "ArrowUp" || k === "PageUp" || k === "k") go(active - 1);
    else if (k === " ") toggle();
    else if (k === "m") setMuted(!muted);
    else return;
    e.preventDefault();
  };

  const showPlayer = still && started;

  return (
    <dialog
      ref={dialog}
      aria-label={t.feedAria}
      data-lenis-prevent
      onClose={onClose}
      onKeyDown={onKey}
      className="feed sheet fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-black p-0 text-white"
    >
      <div
        ref={scroller}
        className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none]"
      >
        {goals.map((g, i) => {
          const v = goalVideo(g);
          return (
            <section
              key={g.id}
              aria-label={format(dict.goals.goalNo, { n: g.n })}
              className="relative flex h-full snap-start snap-always items-center justify-center md:gap-6 md:py-6"
            >
              <div className={`flex flex-col ${v.vertical ? "feed-v" : "feed-h"}`}>
                <div
                  ref={(el) => {
                    medias.current[i] = el;
                  }}
                  onClick={() => i === active && toggle()}
                  className={`relative w-full overflow-hidden bg-neutral-900 md:rounded-xl ${
                    v.vertical ? "aspect-[9/16]" : "aspect-video"
                  }`}
                >
                  <Poster
                    video={v}
                    large
                    eager={Math.abs(i - start) <= 1}
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {i === active && still && !started && (
                    <span className="absolute top-1/2 left-1/2 z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  )}

                  {v.vertical && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/85 via-black/45 to-transparent p-4 pt-24 pr-20 md:pr-4 md:pb-5">
                      <GoalFacts goal={g} demo={v.demo} />
                    </div>
                  )}
                </div>
                {!v.vertical && (
                  <div className="px-4 pt-4 pr-20 md:px-0">
                    <GoalFacts goal={g} demo={v.demo} />
                  </div>
                )}
              </div>

              <FeedRail
                goal={g}
                video={v}
                muted={muted}
                onMute={() => setMuted(!muted)}
                onFilm={() => onFilm(i)}
                className="absolute right-2 bottom-28 z-20 md:static md:self-end md:pb-10"
              />
            </section>
          );
        })}
      </div>

      {/* The one player, laid over the settled slide. Taps fall through to the slide. */}
      <div
        ref={layer}
        className="pointer-events-none absolute top-0 left-0 z-10 overflow-hidden transition-opacity duration-200 md:rounded-xl"
        style={{ opacity: showPlayer ? 1 : 0 }}
      >
        <div ref={host} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 h-4 cursor-pointer"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - r.left) / r.width);
          }}
        >
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
            <span
              ref={bar}
              className="block h-full origin-left bg-linear-to-r from-accent via-garnet to-gold"
              style={{ transform: "scaleX(0)" }}
            />
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent p-3 md:p-4">
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={dict.common.close}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="hud-label text-white/80">
          {String(active + 1).padStart(2, "0")} / {String(goals.length).padStart(2, "0")}
        </p>
        <span className="w-10" />
      </div>

      <div className="absolute top-1/2 right-5 z-30 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label={t.prevGoal}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={active === goals.length - 1}
          aria-label={t.nextGoal}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </dialog>
  );
}
