"use client";

import { Fragment, useEffect, useRef, useSyncExternalStore } from "react";

// Slot-machine text, after React Bits' "Shuffle" (rebuilt without GSAP):
// each letter is a short column of random glyphs that rolls up and lands on
// the real letter. Plays once when scrolled into view, and again when the
// pointer enters the closest [data-shuffle-host] (the card), or the text itself.
// Server HTML and reduced-motion users get plain text.

const STEPS = 5; // random glyphs before the real one
const REST = `translateY(-${(STEPS / (STEPS + 1)) * 100}%)`; // strip offset that shows the real letter
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
// Random glyph of the same kind, so "La Liga" shuffles through lowercase, "EURO" through capitals.
const lookalike = (ch: string) =>
  /\d/.test(ch) ? pick(DIGITS) : ch !== ch.toUpperCase() ? pick(LOWER) : pick(UPPER);
const shuffles = (ch: string) => /[\p{L}\p{N}]/u.test(ch);

const reducedMotion = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = matchMedia(reducedMotion);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function ShuffleText({
  text,
  className,
  duration = 700,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const root = useRef<HTMLSpanElement>(null);
  // false on the server and during hydration, so the first paint matches the HTML.
  const animate = useSyncExternalStore(
    subscribe,
    () => !matchMedia(reducedMotion).matches,
    () => false,
  );

  useEffect(() => {
    const node = root.current;
    if (!animate || !node) return;
    const strips = Array.from(node.querySelectorAll<HTMLElement>("[data-strip]"));
    let running: Animation[] = [];

    const play = () => {
      if (running.some((a) => a.playState === "running")) return;
      // Keep long names snappy: the whole word lands within about a second.
      const stagger = Math.min(40, 450 / strips.length);
      running = strips.map((strip, i) => {
        const real = strip.dataset.char ?? "";
        const items = strip.children;
        for (let k = 0; k < items.length - 1; k++) items[k].textContent = lookalike(real);
        // Even letters first, odd ones a beat later, like the original's "evenodd" stagger.
        const delay = i * stagger + (i % 2 ? 90 : 0);
        return strip.animate([{ transform: "translateY(0)" }, { transform: REST }], {
          duration: duration + Math.random() * 150,
          delay,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        });
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        play();
      },
      { threshold: 0.6 },
    );
    io.observe(node);

    const host = node.closest<HTMLElement>("[data-shuffle-host]") ?? node;
    host.addEventListener("pointerenter", play);

    return () => {
      io.disconnect();
      host.removeEventListener("pointerenter", play);
      running.forEach((a) => a.cancel());
    };
  }, [animate, text, duration]);

  if (!animate) return <span className={className}>{text}</span>;

  return (
    <span ref={root} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(" ").map((word, w) => (
          <Fragment key={w}>
            {w > 0 && " "}
            {/* One box per word, so lines only break between words. */}
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, i) =>
                shuffles(ch) ? (
                  // clip-path (not overflow) clips the strip without moving the letter off the baseline.
                  <span key={i} className="relative inline-block [clip-path:inset(0_-0.06em)]">
                    <span className="invisible">{ch}</span>
                    <span data-strip data-char={ch} className="absolute inset-x-0 top-0" style={{ transform: REST }}>
                      {Array.from({ length: STEPS }, (_, k) => (
                        <span key={k} className="block">
                          {ch}
                        </span>
                      ))}
                      <span className="block">{ch}</span>
                    </span>
                  </span>
                ) : (
                  ch
                ),
              )}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
