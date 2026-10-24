"use client";

import Lenis from "lenis";
import { useEffect } from "react";

let instance: Lenis | null = null;

const NAV_H = 48;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Programmatic scrolls must go through Lenis or they fight the lerp.
export const scrollToY = (y: number) =>
  instance
    ? instance.scrollTo(y, { duration: 1.2, easing: easeOutQuart })
    : window.scrollTo({ top: y, behavior: "smooth" });

export const scrollToEl = (el: Element | null) => {
  if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
};

// Freeze the page behind a modal; Lenis keeps scrolling otherwise.
export const lockScroll = (locked: boolean) => {
  if (locked) instance?.stop();
  else instance?.start();
};

// Scroll-linked effects subscribe here instead of to window "scroll".
// Lenis calls them inside its own animation frame, right after it moves the
// page, so pinned transforms land in the same frame as the scroll itself.
// (A window "scroll" listener + requestAnimationFrame runs one frame late,
// which reads as a stutter on anything pinned.)
type ScrollFn = (y: number) => void;
const subscribers = new Set<ScrollFn>();

export const currentScroll = () => instance?.animatedScroll ?? window.scrollY;

export function subscribeScroll(fn: ScrollFn) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

const notify = (y: number) => subscribers.forEach((fn) => fn(y));

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      autoRaf: true,
      // In-page #links glide instead of jumping, and land below the sticky nav.
      anchors: { offset: -NAV_H, duration: 1.4, easing: easeOutQuart },
    });
    instance = lenis;
    // Fires for wheel/touch smoothing and for native scrolls (keyboard, scrollbar).
    const off = lenis.on("scroll", (l: Lenis) => notify(l.animatedScroll));

    return () => {
      off();
      instance = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
