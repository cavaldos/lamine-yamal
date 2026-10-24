'use client';

/**
 * reactbits.dev/text-animations/text-pressure — rAF port.
 * Font weight tracks the pointer's horizontal position inside the element and
 * eases back to rest when the pointer leaves. Needs a variable font with a
 * `wght` axis — this project already loads Archivo as one.
 */

import { useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/motion';

type Props = {
  text: string;
  className?: string;
  min?: number;
  max?: number;
  weight?: number;
};

export default function TextPressure({
  text,
  className = '',
  min = 200,
  max = 900,
  weight = 400,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;
    let current = weight;
    let target = weight;
    let engaged = false;

    const apply = () => {
      el.style.fontVariationSettings = `'wght' ${current.toFixed(0)}`;
      current += (target - current) * 0.16;
      raf = requestAnimationFrame(apply);
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const p = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      target = min + (max - min) * p;
      engaged = true;
    };
    const leave = () => {
      target = weight;
      engaged = false;
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', leave);
    raf = requestAnimationFrame(apply);

    // no pointer yet: breathe gently so the effect is visible without hover
    if (!engaged) target = (min + max) / 2;

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', leave);
      cancelAnimationFrame(raf);
    };
  }, [min, max, weight]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}