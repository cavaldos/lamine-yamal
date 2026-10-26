"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll } from "@/components/layout/smooth-scroll";
import FilmProgress from "@/components/goals-page/film-progress";
import GoalFacts from "@/components/goals-page/goal-facts";
import { useGoalPlayer } from "@/components/goals-page/use-goal-player";
import { Expand, Pause, Play, Replay, SkipNext, SkipPrev, Volume, VolumeOff, X } from "@/components/ui/icons";
import { goalTitle, goalVideo, poster, thumb, type Goal } from "@/lib/goals";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";
import { fmtTime } from "@/lib/youtube";

// Controls fade out after this long without the pointer moving.
const IDLE_MS = 2600;

const ctl =
  "flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white";

// Back-to-back mode: every goal in the list plays in a row, like one film.
// Each clip starts straight away, over its poster; the bar at the bottom has
// one segment per goal.
export default function GoalFilm({ goals, start, onClose }: { goals: Goal[]; start: number; onClose: () => void }) {
  const dict = useDict();
  const t = dict.goalsPage;
  const dialog = useRef<HTMLDialogElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(start);
  const lastTime = useRef(0);
  const [index, setIndex] = useState(start);
  const [done, setDone] = useState(false);
  const [idle, setIdle] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Destructured: the hook also returns a ref (host), and render may only read plain values.
  const { host, started, playing, muted, load, pause, toggle, restart, setMuted } = useGoalPlayer({
    onEnded: () => next(),
    onError: () => {
      setNotice(t.clipFailed);
      window.setTimeout(() => next(), 1200);
    },
    onFrame: (p, t, dur) => {
      lastTime.current = t;
      if (fill.current) fill.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (clock.current) clock.current.textContent = dur > 0 ? `${fmtTime(t)} / ${fmtTime(dur)}` : "";
    },
  });

  // Load the clip and play it at once.
  const show = useCallback(
    (i: number) => {
      indexRef.current = i;
      setIndex(i);
      setDone(false);
      setNotice(null);
      if (fill.current) fill.current.style.transform = "scaleX(0)";
      load(goalVideo(goals[i]));
    },
    [load, goals],
  );

  // Declared as a function so the player callbacks above can reach it.
  function next() {
    const i = indexRef.current + 1;
    if (i < goals.length) show(i);
    else {
      setDone(true);
      pause();
    }
  }

  // A few seconds in, "previous" restarts the goal instead, like a music player.
  const prev = () => {
    if (lastTime.current - (goalVideo(goals[indexRef.current]).start ?? 0) > 3) restart();
    else show(Math.max(0, indexRef.current - 1));
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else dialog.current?.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (!d.open) d.showModal();
    lockScroll(true);
    show(start);
    return () => {
      lockScroll(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // Runs once per opening; `start` is only the first goal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide the controls (and the cursor) while the film plays untouched.
  const wake = useRef(0);
  const nudge = useCallback(() => {
    setIdle(false);
    window.clearTimeout(wake.current);
    wake.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  useEffect(() => {
    wake.current = window.setTimeout(() => setIdle(true), IDLE_MS);
    return () => window.clearTimeout(wake.current);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === " " || k === "k") toggle();
    else if (k === "ArrowRight" || k === "l") next();
    else if (k === "ArrowLeft" || k === "j") prev();
    else if (k === "m") setMuted(!muted);
    else if (k === "f") fullscreen();
    else return;
    e.preventDefault();
    nudge();
  };

  const goal = goals[index];
  const video = goalVideo(goal);
  const hideChrome = idle && playing;

  return (
    <dialog
      ref={dialog}
      aria-label={t.filmDialogAria}
      data-lenis-prevent
      onClose={onClose}
      onKeyDown={onKey}
      onPointerMove={nudge}
      data-idle={hideChrome}
      className="sheet group/film fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-black p-0 text-white data-[idle=true]:cursor-none"
    >
      <div className="flex h-full flex-col">
        {/* Stage */}
        <div className="relative min-h-0 flex-1 [container-type:size]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={video.id}
            src={thumb(video.id)}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
            style={{ animation: "fade-in 0.8s ease both" }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div
              className={`relative overflow-hidden bg-black shadow-[0_30px_120px_-20px_rgb(0_0_0/0.9)] transition-[width] duration-500 ${
                video.vertical
                  ? "aspect-[9/16] w-[min(100cqw,calc(100cqh*9/16))]"
                  : "aspect-video w-[min(100cqw,calc(100cqh*16/9))]"
              }`}
            >
              <div ref={host} className="pointer-events-none absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
              {!started && !done && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={video.id}
                  src={poster(video, true)}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full bg-black object-cover"
                />
              )}
            </div>
          </div>

          {/* Click anywhere on the picture to pause or resume. */}
          <button
            type="button"
            aria-label={playing ? dict.common.pause : dict.common.play}
            onClick={() => {
              toggle();
              nudge();
            }}
            className="absolute inset-0 cursor-[inherit]"
          />

          {started && !playing && !done && (
            <span className="pointer-events-none absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55">
              <Play className="ml-1 h-8 w-8" />
            </span>
          )}

          {/* What is on screen right now, bottom left. Pinned to both edges on phones: left to
              size itself, the box would grow to the untruncated title and run off screen. */}
          {!done && (
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 max-w-xl bg-linear-to-tr from-black/70 via-black/30 to-transparent p-4 sm:p-5 md:right-auto md:p-8">
              <GoalFacts goal={goal} demo={video.demo} />
            </div>
          )}

          {done && (
            <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
              <div style={{ animation: "reveal-in 0.5s var(--ease-reveal) both" }}>
                <p className="hud-label text-white/60">{t.filmEnd}</p>
                <p className="mt-3 font-display text-5xl font-medium tracking-[-0.04em] md:text-7xl">
                  {format(t.filmEndCount, { count: goals.length })}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => show(0)}
                    className="inline-flex h-12 items-center gap-2 bg-white px-6 font-mono text-[11px] font-bold tracking-[0.12em] text-black uppercase hover:opacity-85"
                  >
                    <Replay className="h-4 w-4" /> {dict.common.replay}
                  </button>
                  <button
                    type="button"
                    onClick={() => dialog.current?.close()}
                    className="inline-flex h-12 items-center border border-white/40 px-6 font-mono text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-white/10"
                  >
                    {dict.common.close}
                  </button>
                </div>
              </div>
            </div>
          )}

          {notice && (
            <p className="hud-label absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-2 text-white">
              {notice}
            </p>
          )}

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent p-3 transition-opacity duration-300 group-data-[idle=true]/film:opacity-0 md:p-4">
            <p className="hud-label px-2 text-white/80">
              {t.filmLabel} <span className="text-white/40">·</span> {format(t.filmCount, { count: goals.length })}
            </p>
            <button type="button" onClick={() => dialog.current?.close()} aria-label={dict.common.close} className={ctl}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Timeline and controls */}
        <div className="relative z-10 bg-linear-to-t from-black to-black/80 px-3 pt-1 pb-[max(env(safe-area-inset-bottom),12px)] md:px-6">
          <FilmProgress goals={goals} index={index} fillRef={fill} onJump={show} />
          <div className="mt-1 flex items-center gap-1 transition-opacity duration-300 group-data-[idle=true]/film:opacity-0">
            <button type="button" onClick={toggle} aria-label={playing ? dict.common.pause : dict.common.play} className={ctl}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <button type="button" onClick={prev} aria-label={t.prevGoal} className={ctl}>
              <SkipPrev className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => next()} aria-label={t.nextGoal} className={ctl}>
              <SkipNext className="h-5 w-5" />
            </button>
            <span ref={clock} className="hud-label ml-2 hidden text-white/60 tabular-nums sm:inline" />

            <p className="hud-label ml-auto min-w-0 truncate px-2 text-white/80">
              <span className="text-white">
                {String(index + 1).padStart(2, "0")}/{String(goals.length).padStart(2, "0")}
              </span>
              <span className="hidden sm:inline">
                {" "}
                · {goalTitle(goal)} · {goal.minute}
              </span>
            </p>

            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? dict.common.unmute : dict.common.mute}
              className={ctl}
            >
              {muted ? <VolumeOff className="h-5 w-5" /> : <Volume className="h-5 w-5" />}
            </button>
            <button type="button" onClick={fullscreen} aria-label={dict.common.fullscreen} className={`${ctl} hidden sm:flex`}>
              <Expand className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
