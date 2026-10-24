"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GoalVideo } from "@/lib/goals";
import { clipProgress, createPlayer, STATE, type YTPlayer } from "@/lib/youtube";

type Options = {
  onEnded?: () => void;
  onError?: () => void;
  // Called every animation frame with the clip's progress (0..1) and times.
  onFrame?: (progress: number, time: number, duration: number) => void;
};

// One YouTube player that is reused for every clip: switching clips calls
// loadVideoById on the same iframe instead of building a new one, which is fast
// and keeps the "allowed to play with sound" permission from the first click.
export function useGoalPlayer(opts: Options) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const waiting = useRef<((p: YTPlayer) => void)[]>([]);
  const video = useRef<GoalVideo | null>(null);
  const reached = useRef(false); // has the current clip played at all?
  const ended = useRef(false); // has onEnded fired for the current clip?
  const autoplayTimer = useRef(0);
  const cb = useRef(opts);
  const [state, setState] = useState<number>(STATE.UNSTARTED);
  const [muted, setMutedState] = useState(false);
  const [started, setStarted] = useState(false); // current clip has shown a frame

  useEffect(() => {
    cb.current = opts;
  });

  const whenReady = useCallback((fn: (p: YTPlayer) => void) => {
    if (player.current) fn(player.current);
    else waiting.current.push(fn);
  }, []);

  const finish = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    cb.current.onEnded?.();
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;
    let made: YTPlayer | null = null;
    let raf = 0;
    let last: number = STATE.UNSTARTED;

    // State events can arrive late and out of order around a clip change (a
    // "paused" for the old clip after "playing" for the new one), so the frame
    // loop below also re-reads the real state and corrects ours.
    const sync = (s: number, p: YTPlayer) => {
      const v = video.current;
      // "Playing" still reported for the previous clip: not ours yet.
      if (s === STATE.PLAYING && v && !p.getVideoUrl().includes(v.id)) return;
      if (s !== last) {
        last = s;
        setState(s);
      }
      if (s === STATE.PLAYING && !reached.current) {
        reached.current = true;
        setStarted(true);
      }
      if (s === STATE.ENDED) finish();
    };

    createPlayer(el, {
      onReady: (p) => {
        if (dead) return;
        player.current = p;
        waiting.current.splice(0).forEach((fn) => fn(p));
      },
      onState: (s, p) => {
        if (!dead) sync(s, p);
      },
      onError: () => {
        if (!dead) cb.current.onError?.();
      },
    })
      .then((p) => {
        made = p;
        if (dead) p.destroy();
      })
      .catch(() => cb.current.onError?.());

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = player.current;
      const v = video.current;
      if (!p || !v || typeof p.getCurrentTime !== "function") return;
      sync(p.getPlayerState(), p);
      const t = p.getCurrentTime();
      const dur = v.end ?? p.getDuration();
      if (!reached.current) {
        cb.current.onFrame?.(0, 0, 0);
        return;
      }
      cb.current.onFrame?.(clipProgress(p, v.start, v.end), t, dur);
      // Move on a beat before YouTube's own end screen (related videos) shows up.
      // (The early return above matters: right after a switch the player can
      // still report the previous clip's time and duration.)
      if (dur > 0 && t >= dur - 0.25 && last === STATE.PLAYING) finish();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(autoplayTimer.current);
      made?.destroy();
      player.current = null;
      el.replaceChildren();
    };
  }, [finish]);

  // If the browser refused to start with sound, start muted instead.
  const guardAutoplay = useCallback(() => {
    window.clearTimeout(autoplayTimer.current);
    autoplayTimer.current = window.setTimeout(() => {
      const p = player.current;
      if (!p || reached.current) return;
      p.mute();
      setMutedState(true);
      p.playVideo();
    }, 2200);
  }, []);

  const begin = useCallback((v: GoalVideo) => {
    video.current = v;
    reached.current = false;
    ended.current = false;
    setStarted(false);
  }, []);

  // Load and play straight away.
  const load = useCallback(
    (v: GoalVideo) => {
      begin(v);
      whenReady((p) => {
        p.loadVideoById({
          videoId: v.id,
          startSeconds: v.start,
          endSeconds: v.end,
        });
        guardAutoplay();
      });
    },
    [begin, whenReady, guardAutoplay],
  );

  // Load without playing (call play() when ready).
  const cue = useCallback(
    (v: GoalVideo) => {
      begin(v);
      whenReady((p) =>
        p.cueVideoById({
          videoId: v.id,
          startSeconds: v.start,
          endSeconds: v.end,
        }),
      );
    },
    [begin, whenReady],
  );

  const play = useCallback(() => {
    whenReady((p) => {
      p.playVideo();
      guardAutoplay();
    });
  }, [whenReady, guardAutoplay]);

  const pause = useCallback(() => whenReady((p) => p.pauseVideo()), [whenReady]);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p) return;
    const s = p.getPlayerState();
    if (s === STATE.PLAYING || s === STATE.BUFFERING) p.pauseVideo();
    else p.playVideo();
  }, []);

  const restart = useCallback(() => {
    const p = player.current;
    const v = video.current;
    if (!p || !v) return;
    ended.current = false;
    p.seekTo(v.start ?? 0, true);
    p.playVideo();
  }, []);

  // Jump to a fraction (0..1) of the clip.
  const seek = useCallback((f: number) => {
    const p = player.current;
    const v = video.current;
    if (!p || !v) return;
    const start = v.start ?? 0;
    const end = v.end ?? p.getDuration();
    ended.current = false;
    p.seekTo(start + f * (end - start), true);
  }, []);

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedState(m);
      whenReady((p) => (m ? p.mute() : p.unMute()));
    },
    [whenReady],
  );

  const playing = state === STATE.PLAYING || state === STATE.BUFFERING;

  return {
    host,
    state,
    playing,
    started,
    muted,
    load,
    cue,
    play,
    pause,
    toggle,
    restart,
    seek,
    setMuted,
  };
}
