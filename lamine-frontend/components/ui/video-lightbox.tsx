"use client";

import { useEffect, useRef, useState } from "react";
import { lockScroll } from "@/components/layout/smooth-scroll";
import { X } from "@/components/ui/icons";

// `vertical` for Shorts (9:16); `start` / `end` trim the clip, in seconds.
export type LightboxVideo = {
  youtube: string;
  title: string;
  source?: string;
  vertical?: boolean;
  start?: number;
  end?: number;
};

let show: ((v: LightboxVideo) => void) | null = null;

// Any component can open the one shared player.
export const openVideo = (v: LightboxVideo) => show?.(v);

export default function VideoLightbox() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [video, setVideo] = useState<LightboxVideo | null>(null);

  useEffect(() => {
    show = (v) => {
      setVideo(v);
      dialog.current?.showModal();
      lockScroll(true);
    };
    return () => {
      show = null;
    };
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    let timer = 0;
    const onClose = () => {
      lockScroll(false);
      // Let the exit fade finish before the iframe (and its audio) goes away.
      timer = window.setTimeout(() => setVideo(null), 260);
    };
    el.addEventListener("close", onClose);
    return () => {
      el.removeEventListener("close", onClose);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={video?.title ?? "Video"}
      data-lenis-prevent
      // Clicking the backdrop (the dialog box itself, outside the frame) closes it.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={`lightbox m-auto max-w-none bg-transparent p-0 text-ink backdrop:backdrop-blur-sm ${
        video?.vertical ? "w-[min(calc((100dvh-120px)*9/16),calc(100vw-32px))]" : "w-[min(1100px,calc(100vw-32px))]"
      }`}
    >
      <div className="border border-line-strong bg-bg-raised">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
          <p className="hud-label min-w-0 truncate text-muted">
            {video?.source && <span className="text-garnet-ink">{video.source} · </span>}
            {video?.title}
          </p>
          <button
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
            aria-label="Đóng video"
            className="invert-block -mr-2 flex h-8 w-8 shrink-0 items-center justify-center text-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={`relative w-full bg-black ${video?.vertical ? "aspect-[9/16]" : "aspect-video"}`}>
          {video && (
            <iframe
              key={video.youtube}
              src={`https://www.youtube-nocookie.com/embed/${video.youtube}?autoplay=1&rel=0&modestbranding=1${
                video.start ? `&start=${video.start}` : ""
              }${video.end ? `&end=${video.end}` : ""}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
      </div>
    </dialog>
  );
}
