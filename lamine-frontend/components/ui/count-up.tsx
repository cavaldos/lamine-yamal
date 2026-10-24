"use client";

import { useLayoutEffect, useRef } from "react";

// Counts from 0 to `to` the first time it scrolls into view.
// Server HTML holds the final value, so it reads correctly without JS.
export default function CountUp({
  to,
  duration = 1600,
  delay = 0,
  className,
}: {
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const el = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = el.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.textContent = "0";
    let raf = 0;
    let timer = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Strong ease-out: fast climb, gentle landing on the final number.
        const eased = 1 - Math.pow(1 - t, 4);
        node.textContent = String(Math.round(eased * to));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(run, delay);
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [to, duration, delay]);

  return (
    <span ref={el} className={`tabular-nums ${className ?? ""}`}>
      {to}
    </span>
  );
}
