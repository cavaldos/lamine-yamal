'use client';

/**
 * reactbits.dev/text-animations/scroll-velocity — GSAP port.
 * Skews/stretches the track by how fast you scroll, then eases back to 0.
 * Uses gsap.ticker (one callback, all frames) instead of a scroll listener.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { reducedMotion } from '@/lib/motion';

type Props = {
  children: ReactNode;
  className?: string;
  velocityFactor?: number;
};

export default function ScrollVelocity({ children, className = '', velocityFactor = 0.5 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const inner = el.querySelector<HTMLElement>('.sv-inner') ?? el;

    let velocity = 0;
    let last = performance.now();
    let running = false;

    const skew = gsap.quickSetter(inner, 'skewX', 'deg');
    const scale = gsap.quickSetter(inner, 'scaleX');

    const tick = () => {
      const now = performance.now();
      // clamp the delta so a dropped frame (tab switch) can't fire a huge spike
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      velocity *= 1 - dt * velocityFactor;
      skew(gsap.utils.clamp(velocity * -0.3, -14, 14));
      scale(1 + Math.min(Math.abs(velocity) / 900, 0.12));
    };

    let lastScroll = window.scrollY;
    let idle = 0;

    // stop writing to the DOM once scrolling has settled
    const stop = () => {
      window.clearTimeout(idle);
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
      skew(0);
      scale(1);
    };

    function onScroll() {
      velocity += window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      if (!running) {
        running = true;
        last = performance.now();
        gsap.ticker.add(tick);
      }
      window.clearTimeout(idle);
      idle = window.setTimeout(stop, 260);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      stop();
    };
  }, [velocityFactor]);

  return (
    <div ref={ref} className={className}>
      <div className="sv-inner">{children}</div>
    </div>
  );
}