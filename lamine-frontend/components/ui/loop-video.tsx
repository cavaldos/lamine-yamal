"use client";

import { useEffect, useRef, useState } from "react";

// A YouTube clip that plays muted and loops in place, like a background video.
// The poster is always there; the iframe only exists while the block is on screen,
// and not at all for visitors who asked for reduced motion.
// It crops to fill its box (any shape), like object-fit: cover. The caller positions it
// (`relative`, or `absolute inset-0`) and gives it a size.
// `zoom` scales the picture up from the centre, to crop away black bars that are part of the upload itself.
export default function LoopVideo({
  id,
  className = "",
  zoom = 1,
}: {
  id: string;
  className?: string;
  zoom?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(reduce.matches);
    sync();
    reduce.addEventListener("change", sync);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => {
      reduce.removeEventListener("change", sync);
      io.disconnect();
    };
  }, []);

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
    loop: "1",
    playlist: id, // YouTube only loops a single video through a playlist of itself
  });

  const playing = visible && !calm;

  return (
    <div
      ref={box}
      aria-hidden
      className={`overflow-hidden bg-black [container-type:size] ${className}`}
    >
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {playing && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
            title=""
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            onLoad={() => setReady(true)}
            className={`pointer-events-none absolute top-1/2 left-1/2 h-[max(100cqh,calc(100cqw*9/16))] w-[max(100cqw,calc(100cqh*16/9))] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}
