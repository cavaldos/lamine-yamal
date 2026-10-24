'use client';

/**
 * reactbits.dev/text-animations/scroll-float — GSAP port.
 * Each character rises from below with a vertical squash, scrubbed by scroll
 * (not fired once), so the heading assembles as you scroll into it.
 */

import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  text: string;
  className?: string;
  start?: string;
  end?: string;
};

export default function ScrollFloat({ text, className = '', start = 'top bottom-=18%', end = 'bottom 62%' }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  const chars = useMemo(
    () =>
      text.split('').map((c, i) => (
        <span key={i} className="sf-char" aria-hidden="true">
          {c === ' ' ? ' ' : c}
        </span>
      )),
    [text],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const targets = el.querySelectorAll('.sf-char');

    const tween = gsap.fromTo(
      targets,
      { opacity: 0, yPercent: 110, scaleY: 2.2, scaleX: 0.72, transformOrigin: '50% 0%' },
      {
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        ease: 'none',
        stagger: 0.04,
        scrollTrigger: { trigger: el, start, end, scrub: true },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [text, start, end]);

  return (
    <h2 ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="sf-track">
        {chars}
      </span>
    </h2>
  );
}