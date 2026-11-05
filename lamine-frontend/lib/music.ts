"use client";

import { useEffect } from "react";
import { create } from "zustand";

// Background music for the whole site: a playlist of YouTube videos played by the
// small player in the nav bar (components/layout/music-player.tsx).
export const TRACKS = [
  { id: "Tmc7iS2NW1g", title: "Mở Lòng Vì Ai x Y Qué Fue", artist: "Ness Remix" },
  { id: "vHeO-9G5rxo", title: "Y Qué Fue?", artist: "Don Miguelo" },
] as const;

export const DEFAULT_VOLUME = 35;

// What the visitor chose, kept in localStorage ("lamine-music"). `time` lets the song
// pick up where it was after a full page load (switching language reloads the page).
export type MusicPrefs = { on: boolean; volume: number; muted: boolean; track: number; time: number };

const KEY = "lamine-music";
const DEFAULTS: MusicPrefs = { on: true, volume: DEFAULT_VOLUME, muted: false, track: 0, time: 0 };

export function readPrefs(): MusicPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!raw || typeof raw !== "object") return DEFAULTS;
    const p = { ...DEFAULTS, ...raw } as MusicPrefs;
    return {
      on: Boolean(p.on),
      volume: Math.min(100, Math.max(0, Number(p.volume) || 0)),
      muted: Boolean(p.muted),
      track: Number.isInteger(p.track) && p.track >= 0 && p.track < TRACKS.length ? p.track : 0,
      time: Math.max(0, Number(p.time) || 0),
    };
  } catch {
    return DEFAULTS;
  }
}

export function writePrefs(p: MusicPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

// The player's state, shared so other components can step in:
// - `on`, `volume`, `muted`, `track`: the visitor's choices (saved, see above);
// - `loaded`: the saved choices have been read (after hydration, so the first
//   client render matches the server's HTML);
// - `activated`: the visitor has clicked, tapped or typed, so sound is allowed;
// - `others`: how many other players (the lightbox, goal and highlight videos)
//   are playing with sound right now. The music pauses for them.
type Music = Omit<MusicPrefs, "time"> & {
  loaded: boolean;
  activated: boolean;
  others: number;
};

export const useMusic = create<Music>(() => ({
  ...DEFAULTS,
  loaded: false,
  activated: false,
  others: 0,
}));

export const setMusic = (patch: Partial<Music>) => useMusic.setState(patch);

// Call with `true` while a video is playing with sound.
export function useAudioFocus(active: boolean) {
  useEffect(() => {
    if (!active) return;
    useMusic.setState((s) => ({ others: s.others + 1 }));
    return () => useMusic.setState((s) => ({ others: Math.max(0, s.others - 1) }));
  }, [active]);
}
