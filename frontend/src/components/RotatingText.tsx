'use client';

/**
 * reactbits.dev/text-animations/rotating-text — GSAP port.
 * One word at a time; the outgoing word drops away as the next slides up.
 * Only CSS transitions, so it costs nothing per frame.
 */

import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '@/lib/motion';

type Props = {
  words: string[];
  className?: string;
  interval?: number;
};

export default function RotatingText({ words, className = '', interval = 2200 }: Props) {
  const [i, setI] = useState(0);
  const timer = useRef(0);

  useEffect(() => {
    if (words.length < 2 || reducedMotion()) return;
    timer.current = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(timer.current);
  }, [words, interval]);

  if (!words.length) return null;

  return (
    <span className={`rotating ${className}`}>
      <span className="rotating-slot">
        {words.map((w, n) => (
          <span key={w} className="rotating-word" data-active={n === i || undefined}>
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}