"use client";

import HoverPreview, { useHoverPreview } from "@/components/ui/hover-preview";
import { Play } from "@/components/ui/icons";
import type { Video } from "@/lib/content";

// One video in the grid. Hovering plays it muted in place; clicking opens the player.
export default function HighlightCard({ video, n, onOpen }: { video: Video; n: number; onOpen: () => void }) {
  const { active, handlers } = useHoverPreview();

  return (
    <button
      type="button"
      onClick={onOpen}
      {...handlers}
      aria-label={`Xem ${video.title}`}
      className="glow-card group flex h-full w-full flex-col bg-bg text-left outline outline-line focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex w-full items-center justify-between gap-4 border-b border-line px-5 py-2.5">
        <p className="hud-label truncate text-muted">{video.source}</p>
        <p className="hud-label text-faint">{String(n).padStart(2, "0")}</p>
      </div>
      <div className="thumb-zoom relative aspect-video w-full overflow-hidden bg-bg-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${video.youtube}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {active && <HoverPreview id={video.youtube} cover />}
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        {!active && (
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/40 transition-[background-color,transform] duration-200 group-hover:scale-110 group-hover:bg-garnet"
          >
            <Play className="ml-0.5 h-5 w-5" />
          </span>
        )}
        {video.length && (
          <span className="hud-label absolute right-3 bottom-3 bg-black/70 px-2 py-1 text-white">{video.length}</span>
        )}
      </div>
      <div className="flex-1 px-5 py-5">
        <h3 className="font-display text-lg font-medium tracking-[-0.02em] text-ink-strong">{video.title}</h3>
      </div>
    </button>
  );
}
