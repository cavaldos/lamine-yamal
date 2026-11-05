"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, MusicNote, Pause, Play, SkipNext, SkipPrev, Volume, VolumeOff, X } from "@/components/ui/icons";
import { useDict } from "@/lib/i18n/provider";
import { readPrefs, setMusic, TRACKS, useMusic, writePrefs } from "@/lib/music";
import { createPlayer, STATE, type YTPlayer } from "@/lib/youtube";

// Browsers only allow sound after the visitor has clicked, tapped or typed once.
const GESTURES = ["mousedown", "pointerup", "touchend", "keydown"] as const;

// How long another video has to stay quiet before the music comes back. Covers the
// gap between two goal clips, so the music doesn't blip in between.
const RESUME_DELAY = 900;

const pad = (n: number) => String(n).padStart(2, "0");

const iconBtn =
  "invert-block flex h-9 w-9 shrink-0 items-center justify-center text-muted disabled:pointer-events-none disabled:opacity-40";

// The background-music button in the top-left of the nav bar, and its panel: a small
// YouTube player, play / pause, previous / next, volume and the playlist. The music
// keeps going across pages (the nav lives in the root layout) and pauses by itself
// while another video on the page plays with sound.
export default function MusicPlayer() {
  const dict = useDict();
  const t = dict.music;
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const made = useRef<YTPlayer | null>(null); // set before onReady, so an early unmount can still destroy it
  const creating = useRef(false);
  const pending = useRef(false); // play as soon as the player is ready
  const resumeAt = useRef(0); // where the saved song left off, for the first load only

  const { on, volume, muted, track, loaded, activated, others } = useMusic();
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  // Songs YouTube refused to play here (the owner blocked embedding). Skipped from then on.
  const [blocked, setBlocked] = useState<number[]>([]);
  const blockedRef = useRef<number[]>([]);

  const want = on && activated && others === 0;
  const latest = useRef({ on, volume, muted, track });
  useEffect(() => {
    latest.current = { on, volume, muted, track };
  });

  const save = useCallback(() => {
    const p = player.current;
    const time = p && typeof p.getCurrentTime === "function" ? p.getCurrentTime() : resumeAt.current;
    writePrefs({ ...latest.current, time: Math.floor(time || 0) });
  }, []);

  const ensurePlayer = useCallback(() => {
    const el = host.current;
    if (creating.current || !el) return;
    creating.current = true;
    createPlayer(el, {
      onReady: (p) => {
        player.current = p;
        const { volume: v, muted: m, track: i } = latest.current;
        p.setVolume(v);
        if (m) p.mute();
        else p.unMute();
        const o = { videoId: TRACKS[i].id, startSeconds: resumeAt.current };
        resumeAt.current = 0;
        if (pending.current) p.loadVideoById(o);
        else p.cueVideoById(o);
      },
      // 101 / 150: not allowed in embeds; 100: removed; 2 / 5: bad id or HTML5 error.
      // Mark the song and move on to the next one that still plays.
      onError: (_code, p) => {
        const bad = latest.current.track;
        if (!blockedRef.current.includes(bad)) blockedRef.current = [...blockedRef.current, bad];
        setBlocked(blockedRef.current);
        setPlaying(false);
        const next = TRACKS.findIndex((_, k) => !blockedRef.current.includes((bad + 1 + k) % TRACKS.length));
        if (next === -1) return;
        const i = (bad + 1 + next) % TRACKS.length;
        latest.current.track = i;
        setMusic({ track: i });
        if (pending.current) p.loadVideoById({ videoId: TRACKS[i].id });
        else p.cueVideoById({ videoId: TRACKS[i].id });
      },
      onState: (s, p) => {
        if (s === STATE.PLAYING) setPlaying(true);
        else if (s !== STATE.BUFFERING) setPlaying(false);
        // Song over: on to the next one, round the playlist.
        if (s === STATE.ENDED) {
          const next = (latest.current.track + 1) % TRACKS.length;
          latest.current.track = next;
          setMusic({ track: next });
          p.loadVideoById({ videoId: TRACKS[next].id });
        }
      },
    })
      .then((p) => {
        made.current = p;
      })
      .catch(() => {
        creating.current = false;
      });
  }, []);

  // Starts (or resumes) the song, building the player the first time.
  const start = useCallback(() => {
    pending.current = true;
    const p = player.current;
    if (!p) return ensurePlayer();
    const s = p.getPlayerState();
    if (s !== STATE.PLAYING && s !== STATE.BUFFERING) p.playVideo();
  }, [ensurePlayer]);

  const stop = useCallback(() => {
    pending.current = false;
    player.current?.pauseVideo();
  }, []);

  // Read the saved choices once; tear the player down on unmount.
  useEffect(() => {
    const el = host.current;
    const { time, ...prefs } = readPrefs();
    latest.current = prefs;
    resumeAt.current = time;
    setMusic({ ...prefs, loaded: true });
    return () => {
      made.current?.destroy();
      made.current = player.current = null;
      creating.current = false;
      el?.replaceChildren();
    };
  }, []);

  // Wait for the first click / tap / key press anywhere on the page.
  useEffect(() => {
    if (navigator.userActivation?.hasBeenActive) return setMusic({ activated: true });
    const go = () => setMusic({ activated: true });
    GESTURES.forEach((e) => window.addEventListener(e, go, { capture: true, once: true, passive: true }));
    return () => GESTURES.forEach((e) => window.removeEventListener(e, go, { capture: true }));
  }, []);

  // Play when the visitor wants music and nothing else is talking; pause otherwise.
  useEffect(() => {
    if (!loaded) return;
    if (!want) {
      stop();
      return;
    }
    const id = window.setTimeout(start, RESUME_DELAY);
    return () => window.clearTimeout(id);
  }, [want, loaded, start, stop]);

  // Remember the choices, and where the song is, so a reload carries on.
  useEffect(() => {
    if (loaded) save();
  }, [loaded, on, volume, muted, track, save]);

  useEffect(() => {
    window.addEventListener("pagehide", save);
    const id = playing ? window.setInterval(save, 5000) : 0;
    return () => {
      window.removeEventListener("pagehide", save);
      window.clearInterval(id);
    };
  }, [playing, save]);

  // The panel closes on Escape or a click outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = playing || want; // what the play / pause button shows

  const togglePlay = () => {
    if (active) {
      setMusic({ on: false });
      stop();
    } else {
      setMusic({ on: true, activated: true });
      start(); // inside the click, so even strict browsers allow the sound
    }
  };

  const pick = (i: number) => {
    latest.current.track = i;
    setMusic({ track: i, on: true, activated: true });
    resumeAt.current = 0;
    pending.current = true;
    const p = player.current;
    if (p) p.loadVideoById({ videoId: TRACKS[i].id });
    else ensurePlayer();
  };

  // Previous / next, skipping songs that can't play here.
  const step = (by: number) => {
    for (let k = 1; k <= TRACKS.length; k++) {
      const i = (track + by * k + TRACKS.length * k) % TRACKS.length;
      if (!blocked.includes(i)) return pick(i);
    }
  };

  const changeVolume = (v: number) => {
    const p = player.current;
    p?.setVolume(v);
    if (muted && v > 0) p?.unMute();
    setMusic({ volume: v, muted: muted && v === 0 });
  };

  const toggleMute = () => {
    const m = !muted;
    setMusic({ muted: m });
    const p = player.current;
    if (m) p?.mute();
    else p?.unMute();
  };

  const song = TRACKS[track];
  const silent = muted || volume === 0;
  const hint = on && !activated ? t.waiting : on && others > 0 ? t.ducked : null;

  return (
    <div ref={root} className="flex items-stretch">
      <button
        type="button"
        aria-label={t.settings}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex w-10 items-center justify-center border-r border-line text-muted transition-colors hover:text-ink aria-expanded:bg-invert-bg aria-expanded:text-invert-fg sm:w-12"
      >
        {playing && !silent ? <Equalizer /> : <MusicNote className="h-4 w-4" />}
        {playing && silent && <span aria-hidden className="absolute top-2.5 right-2 h-1.5 w-1.5 bg-garnet" />}
      </button>

      <div
        role="dialog"
        aria-label={t.title}
        inert={!open}
        data-lenis-prevent
        className={`absolute top-full left-0 z-50 w-screen max-w-80 border border-t-0 border-line-strong bg-bg-raised shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] transition-[opacity,translate,visibility] duration-200 ease-(--ease-reveal) ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line py-1 pr-1 pl-4">
          <p className="hud-label text-muted">{t.title}</p>
          <button type="button" onClick={() => setOpen(false)} aria-label={dict.common.close} className={iconBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The iframe stays mounted while the panel is hidden, so the music keeps going. */}
        <div
          className="relative aspect-video w-full bg-black bg-cover bg-center"
          style={{ backgroundImage: `url(https://i.ytimg.com/vi/${song.id}/hqdefault.jpg)` }}
        >
          <div ref={host} className="pointer-events-none absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
        </div>

        <div className="px-4 pt-3">
          <p className="hud-label flex items-center gap-2 text-faint">
            <span className="text-garnet-ink">
              {pad(track + 1)} / {pad(TRACKS.length)}
            </span>
            <span className="truncate">{song.artist}</span>
          </p>
          <p className="mt-1 truncate font-display text-base font-semibold text-ink-strong" title={song.title}>
            {song.title}
          </p>
        </div>

        <div className="flex items-center gap-1 px-2 py-2">
          <button type="button" onClick={() => step(-1)} aria-label={t.prev} className={iconBtn}>
            <SkipPrev className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={active ? t.pause : t.play}
            className="flex h-9 w-9 shrink-0 items-center justify-center bg-invert-bg text-invert-fg transition-opacity hover:opacity-80"
          >
            {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => step(1)} aria-label={t.next} className={iconBtn}>
            <SkipNext className="h-4 w-4" />
          </button>

          <span aria-hidden className="mx-1 h-5 w-px bg-line" />

          <button type="button" onClick={toggleMute} aria-label={silent ? dict.common.unmute : dict.common.mute} className={iconBtn}>
            {silent ? <VolumeOff className="h-4 w-4" /> : <Volume className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label={t.volume}
            className="h-1 min-w-0 flex-1 cursor-pointer accent-accent"
          />
          <span className="hud-label w-8 shrink-0 text-right text-faint tabular-nums">{muted ? 0 : volume}</span>
        </div>

        <ul className="border-t border-line py-1">
          {TRACKS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={i === track ? "true" : undefined}
                className="group flex w-full items-center gap-3 px-4 py-2 text-left text-muted hover:bg-line hover:text-ink aria-current:text-ink"
              >
                <span className="hud-label w-5 shrink-0 text-faint group-aria-current:text-garnet-ink">{pad(i + 1)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{s.title}</span>
                {i === track && playing && <Equalizer small />}
                {blocked.includes(i) && <span className="hud-label shrink-0 text-danger">{t.blocked}</span>}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="min-w-0 text-xs text-faint" aria-live="polite">
            {hint}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${song.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hud-label flex shrink-0 items-center gap-1 text-faint hover:text-ink"
          >
            {t.youtube}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Four bouncing bars: the music is playing.
function Equalizer({ small }: { small?: boolean }) {
  return (
    <span aria-hidden className={`flex items-end gap-[2px] ${small ? "h-3" : "h-4"}`}>
      {[0, 0.3, 0.15, 0.45].map((delay) => (
        <span
          key={delay}
          className="eq-bar h-full w-[3px] bg-current"
          style={{ animationDelay: `-${delay}s` }}
        />
      ))}
    </span>
  );
}
