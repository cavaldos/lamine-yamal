'use client';

/** reactbits.dev/text-animations/count-up — rAF port (no motion/react spring). */

import { useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/motion';

type Props = {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
};

export default function CountUp({ to, from = 0, duration = 2, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.textContent = String(from);
    if (reducedMotion()) {
      el.textContent = String(to);
      return;
    }

    let raf = 0;
    let start = 0;
    let timer = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / (duration * 1000), 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          raf = requestAnimationFrame(step);
        }, delay * 1000);
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, from, duration, delay]);

  return <span ref={ref} className={className} />;
}