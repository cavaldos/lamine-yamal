"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll } from "@/components/layout/smooth-scroll";
import { useGoalPlayer } from "@/components/goals-page/use-goal-player";
import { Expand, Pause, Play, Replay, SkipNext, SkipPrev, Volume, VolumeOff, X } from "@/components/ui/icons";
import { videoTitle, type Video } from "@/lib/content";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";
import { fmtTime } from "@/lib/youtube";

// Controls fade out after this long without the pointer moving.
const IDLE_MS = 2600;

const ctl =
  "flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white";

const asClip = (v: Video) => ({ id: v.youtube, vertical: false, demo: false });

// The player: one video fills the stage, the list sits beside it (below on a
// phone). When a video ends the next one starts; clicking a row jumps to it.
export default function HighlightTheater({
  videos,
  start,
  onClose,
}: {
  videos: Video[];
  start: number;
  onClose: () => void;
}) {
  const dict = useDict();
  const t = dict.highlightsPage;
  const dialog = useRef<HTMLDialogElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const indexRef = useRef(start);
  const [index, setIndex] = useState(start);
  const [done, setDone] = useState(false);
  const [idle, setIdle] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Destructured: the hook also returns a ref (host), and render may only read plain values.
  const { host, started, playing, muted, load, pause, toggle, seek, setMuted } = useGoalPlayer({
    onEnded: () => next(),
    onError: () => {
      setNotice(t.clipFailed);
      window.setTimeout(() => next(), 1200);
    },
    onFrame: (p, t, dur) => {
      if (fill.current) fill.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (clock.current) clock.current.textContent = dur > 0 ? `${fmtTime(t)} / ${fmtTime(dur)}` : "";
    },
  });

  const show = useCallback(
    (i: number) => {
      indexRef.current = i;
      setIndex(i);
      setDone(false);
      setNotice(null);
      if (fill.current) fill.current.style.transform = "scaleX(0)";
      load(asClip(videos[i]));
    },
    [load, videos],
  );

  // Declared as a function so the player callbacks above can reach it.
  function next() {
    const i = indexRef.current + 1;
    if (i < videos.length) show(i);
    else {
      setDone(true);
      pause();
    }
  }

  const prev = () => show(Math.max(0, indexRef.current - 1));

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
    // Runs once per opening; `start` is only the first video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the playing row in view in the list.
  useEffect(() => {
    rows.current[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  // Hide the controls (and the cursor) while the video plays untouched.
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
    else if (k === "ArrowRight" || k === "l" || k === "n") next();
    else if (k === "ArrowLeft" || k === "j" || k === "p") prev();
    else if (k === "m") setMuted(!muted);
    else if (k === "f") fullscreen();
    else return;
    e.preventDefault();
    nudge();
  };

  const video = videos[index];
  const hideChrome = idle && playing;

  return (
    <dialog
      ref={dialog}
      aria-label={t.theaterAria}
      data-lenis-prevent
      onClose={onClose}
      onKeyDown={onKey}
      onPointerMove={nudge}
      data-idle={hideChrome}
      className="sheet group/film fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-black p-0 text-white data-[idle=true]:cursor-none"
    >
      <div className="flex h-full flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Stage */}
          <div className="relative min-h-0 flex-1 [container-type:size]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={video.youtube}
              src={`https://i.ytimg.com/vi/${video.youtube}/hqdefault.jpg`}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
              style={{ animation: "fade-in 0.8s ease both" }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative aspect-video w-[min(100cqw,calc(100cqh*16/9))] overflow-hidden bg-black shadow-[0_30px_120px_-20px_rgb(0_0_0/0.9)]">
                <div ref={host} className="pointer-events-none absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
                {!started && !done && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={video.youtube}
                    src={`https://i.ytimg.com/vi/${video.youtube}/hq720.jpg`}
                    onError={(e) => {
                      const img = e.currentTarget;
                      const small = `https://i.ytimg.com/vi/${video.youtube}/hqdefault.jpg`;
                      if (img.src !== small) img.src = small;
                    }}
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

            {!done && (
              <div className="pointer-events-none absolute bottom-0 left-0 max-w-xl bg-linear-to-tr from-black/70 via-black/30 to-transparent p-5 transition-opacity duration-300 group-data-[idle=true]/film:opacity-0 md:p-8">
                <p className="hud-label text-white/65">{video.source}</p>
                <p className="mt-1.5 font-display text-xl font-medium tracking-[-0.03em] md:text-3xl">{videoTitle(video, dict)}</p>
              </div>
            )}

            {done && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
                <div style={{ animation: "reveal-in 0.5s var(--ease-reveal) both" }}>
                  <p className="hud-label text-white/60">{t.end}</p>
                  <p className="mt-3 font-display text-5xl font-medium tracking-[-0.04em] md:text-7xl">
                    {format(t.endCount, { count: videos.length })}
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

            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent p-3 transition-opacity duration-300 group-data-[idle=true]/film:opacity-0 md:p-4">
              <p className="hud-label px-2 text-white/80">
                {t.theaterLabel} <span className="text-white/40">·</span> {String(index + 1).padStart(2, "0")} /{" "}
                {String(videos.length).padStart(2, "0")}
              </p>
              <button type="button" onClick={() => dialog.current?.close()} aria-label={dict.common.close} className={ctl}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Timeline and controls */}
          <div className="relative z-10 bg-linear-to-t from-black to-black/80 px-3 pt-1 pb-[max(env(safe-area-inset-bottom),12px)] md:px-6">
            <div
              ref={bar}
              className="group/bar flex h-5 cursor-pointer items-center"
              onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seek((e.clientX - r.left) / r.width);
              }}
            >
              <span className="relative block h-[4px] w-full overflow-hidden rounded-full bg-white/20 transition-[height] group-hover/bar:h-[6px]">
                <span
                  ref={fill}
                  className="absolute inset-0 origin-left bg-linear-to-r from-accent via-garnet to-gold"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 transition-opacity duration-300 group-data-[idle=true]/film:opacity-0">
              <button type="button" onClick={toggle} aria-label={playing ? dict.common.pause : dict.common.play} className={ctl}>
                {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>
              <button type="button" onClick={prev} disabled={index === 0} aria-label={t.prev} className={`${ctl} disabled:opacity-30`}>
                <SkipPrev className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => next()} aria-label={t.next} className={ctl}>
                <SkipNext className="h-5 w-5" />
              </button>
              <span ref={clock} className="hud-label ml-2 text-white/60 tabular-nums" />

              <button
                type="button"
                onClick={() => setMuted(!muted)}
                aria-label={muted ? dict.common.unmute : dict.common.mute}
                className={`${ctl} ml-auto`}
              >
                {muted ? <VolumeOff className="h-5 w-5" /> : <Volume className="h-5 w-5" />}
              </button>
              <button type="button" onClick={fullscreen} aria-label={dict.common.fullscreen} className={`${ctl} hidden sm:flex`}>
                <Expand className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* The list */}
        <aside
          aria-label={t.listAria}
          className="flex max-h-[36dvh] min-h-0 shrink-0 flex-col border-t border-white/10 bg-black lg:max-h-none lg:w-[24rem] lg:border-t-0 lg:border-l"
        >
          <p className="hud-label shrink-0 border-b border-white/10 px-4 py-3 text-white/60">
            {format(t.playlist, { count: videos.length })}
          </p>
          <ol className="thin-scroll min-h-0 flex-1 overflow-y-auto">
            {videos.map((v, i) => (
              <li key={v.youtube}>
                <button
                  ref={(el) => {
                    rows.current[i] = el;
                  }}
                  type="button"
                  onClick={() => show(i)}
                  aria-current={i === index ? "true" : undefined}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/8 aria-[current=true]:bg-white/12"
                >
                  <span className="hud-label mt-1 w-5 shrink-0 text-white/40 tabular-nums">
                    {i === index ? <Play className="h-3 w-3 text-garnet" /> : String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden bg-neutral-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {v.length && (
                      <span className="hud-label absolute right-1 bottom-1 bg-black/75 px-1 py-0.5 text-[9px] text-white">
                        {v.length}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] leading-snug font-medium text-white">{videoTitle(v, dict)}</span>
                    <span className="hud-label mt-1 block truncate text-[10px] text-white/50">{v.source}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </dialog>
  );
}
