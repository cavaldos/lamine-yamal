"use client";

import { Play } from "@/components/ui/icons";
import { openVideo } from "@/components/ui/video-lightbox";
import type { Video } from "@/lib/content";

// A YouTube thumbnail that opens the shared player — no iframe until it is asked for.
export default function VideoCard({
  video,
  index,
  large = false,
}: {
  video: Video;
  index: number;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => openVideo(video)}
      className="glow-card group flex h-full w-full flex-col bg-bg text-left"
    >
      <div className="flex w-full items-center justify-between gap-4 border-b border-line px-5 py-2.5">
        <p className="hud-label truncate text-muted">{video.source}</p>
        <p className="hud-label text-faint">{String(index + 1).padStart(2, "0")}</p>
      </div>
      <div className="thumb-zoom relative aspect-video w-full overflow-hidden bg-bg-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${video.youtube}/${large ? "maxresdefault" : "hqdefault"}.jpg`}
          onError={(e) => {
            // Not every upload has a max-res thumbnail.
            const img = e.currentTarget;
            if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${video.youtube}/hqdefault.jpg`;
          }}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/40 transition-[background-color,transform] duration-200 group-hover:scale-110 group-hover:bg-garnet">
          <Play className="ml-0.5 h-5 w-5" />
        </span>
        {video.length && (
          <span className="hud-label absolute right-3 bottom-3 bg-black/70 px-2 py-1 text-white">
            {video.length}
          </span>
        )}
      </div>
      <div className="flex-1 px-5 py-5">
        <h3
          className={`font-display font-medium tracking-[-0.02em] text-ink-strong ${
            large ? "text-2xl md:text-3xl" : "text-lg"
          }`}
        >
          {video.title}
        </h3>
      </div>
    </button>
  );
}
