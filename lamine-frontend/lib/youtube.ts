// A small typed wrapper around the YouTube IFrame Player API.
// The API script loads once, the first time a player is needed.
// No "@/" imports: scripts/notion-sync.mts loads parseYouTube through lib/notion.

import { parseTimecode } from "./timecode.ts";

export const STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

export type YTPlayer = {
  loadVideoById(o: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  cueVideoById(o: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoUrl(): string;
  destroy(): void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    o: {
      host?: string;
      width?: string;
      height?: string;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number; target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YTNamespace> | null = null;

export function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  loading ??= new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      loading = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type PlayerEvents = {
  onReady?: (p: YTPlayer) => void;
  onState?: (state: number, p: YTPlayer) => void;
  onError?: (code: number, p: YTPlayer) => void;
};

// Builds a chrome-less player inside `host`. The API replaces the element it is
// given with an iframe, so it gets a throwaway child, never a React-owned node.
export async function createPlayer(host: HTMLElement, events: PlayerEvents) {
  const YT = await loadYouTube();
  const mount = document.createElement("div");
  host.appendChild(mount);
  return new YT.Player(mount, {
    host: "https://www.youtube-nocookie.com",
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      origin: window.location.origin,
    },
    events: {
      onReady: (e) => events.onReady?.(e.target),
      onStateChange: (e) => events.onState?.(e.data, e.target),
      onError: (e) => events.onError?.(e.data, e.target),
    },
  });
}

// Where the clip is, from 0 to 1, honouring start/end trims.
export function clipProgress(p: YTPlayer, start = 0, end?: number) {
  const dur = end ?? p.getDuration();
  if (!dur || dur <= start) return 0;
  return Math.min(1, Math.max(0, (p.getCurrentTime() - start) / (dur - start)));
}

// Accepts a bare id or any youtube.com / youtu.be link (watch, shorts, embed, live).
export function parseYouTube(value: string) {
  const v = value.trim();
  if (/^[\w-]{11}$/.test(v)) return { id: v, vertical: false };
  try {
    const url = new URL(v.startsWith("http") ? v : `https://${v}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = url.hostname.endsWith("youtu.be")
      ? parts[0]
      : (url.searchParams.get("v") ?? (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null));
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return {
      id,
      vertical: parts[0] === "shorts",
      start: parseTimecode(url.searchParams.get("t") ?? url.searchParams.get("start") ?? ""),
    };
  } catch {
    return null;
  }
}
