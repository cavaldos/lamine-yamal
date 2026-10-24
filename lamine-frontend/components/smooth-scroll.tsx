"use client";

import Lenis from "lenis";
import { useEffect } from "react";

let instance: Lenis | null = null;

// Programmatic scrolls must go through Lenis or they fight the lerp.
export const scrollToY = (y: number) =>
  instance
    ? instance.scrollTo(y, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
    : window.scrollTo({ top: y, behavior: "smooth" });

export const scrollToEl = (el: Element | null) => {
  if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
};

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      autoRaf: true,
    });
    instance = lenis;
    return () => {
      instance = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
