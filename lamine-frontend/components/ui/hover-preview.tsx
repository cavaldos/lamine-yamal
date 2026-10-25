"use client";

import { useEffect, useRef, useState } from "react";

// Mouse hover only: touch has no hover, and a tap should open the player, not start a preview.
// The short delay keeps a cursor sweeping across the grid from loading every clip it passes.
export function useHoverPreview(delay = 250) {
  const [active, setActive] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handlers = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      timer.current = window.setTimeout(() => setActive(true), delay);
    },
    onPointerLeave: () => {
      window.clearTimeout(timer.current);
      setActive(false);
    },
  };

  return { active, handlers };
}

// A muted, chrome-less YouTube embed laid over a thumbnail. Mount it while hovering, unmount it after:
// the iframe (and its network) only exists while the clip is playing.
// `cover` crops a landscape clip to fill a portrait frame instead of letterboxing it.
export default function HoverPreview({
  id,
  start,
  end,
  vertical = false,
  cover = false,
}: {
  id: string;
  start?: number;
  end?: number;
  vertical?: boolean;
  cover?: boolean;
}) {
  const [ready, setReady] = useState(false);

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    cc_load_policy: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
  });
  if (start) params.set("start", String(start));
  if (end) params.set("end", String(end));
  // YouTube only loops a single video through a playlist of itself, and trimming breaks that.
  else {
    params.set("loop", "1");
    params.set("playlist", id);
  }

  const crop = cover && !vertical;

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
      title=""
      tabIndex={-1}
      aria-hidden
      allow="autoplay; encrypted-media"
      onLoad={() => setReady(true)}
      className={`pointer-events-none absolute border-0 bg-black transition-opacity duration-300 ${
        ready ? "opacity-100" : "opacity-0"
      } ${
        crop
          ? "top-0 left-1/2 h-full w-auto -translate-x-1/2 aspect-video"
          : "inset-0 h-full w-full"
      }`}
    />
  );
}
