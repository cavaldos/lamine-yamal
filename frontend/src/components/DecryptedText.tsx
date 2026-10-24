'use client';

/**
 * reactbits.dev/text-animations/decrypted-text — rAF port.
 * Characters cycle through a glyph set until each locks to its real value.
 * Respects reduced motion (renders final text) and exposes the real string to
 * screen readers via the visible node's own text.
 */

import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '@/lib/motion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*+=';

type Props = {
  text: string;
  className?: string;
  speed?: number;
  iterations?: number;
  startOnView?: boolean;
};

export default function DecryptedText({
  text,
  className = '',
  speed = 45,
  iterations = 8,
  startOnView = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;

    let raf = 0;
    let tick = 0;
    let settled = 0;

    const run = () => {
      tick += 1;
      // each position locks down one at a time, left to right
      settled = Math.min(Math.floor((tick / iterations) * text.length), text.length - 1);
      setFrame(
        text
          .split('')
          .map((c, i) =>
            c === ' ' || i <= settled ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(''),
      );
      if (tick < iterations * text.length) raf = window.setTimeout(() => requestAnimationFrame(run), speed);
    };

    if (!startOnView) {
      raf = requestAnimationFrame(run);
    } else {
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          requestAnimationFrame(run);
        },
        { threshold: 0.6 },
      );
      io.observe(el);
      return () => io.disconnect();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(raf);
      setFrame(text);
    };
  }, [text, speed, iterations, startOnView]);

  return (
    <span ref={ref} className={className}>
      {frame}
    </span>
  );
}