'use client';

/**
 * reactbits.dev/text-animations/scroll-reveal — GSAP port.
 * The block un-rotates while every word fades + unblurs, scrubbed by scroll.
 */

import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  text: string;
  className?: string;
  baseOpacity?: number;
  blurStrength?: number;
  rotation?: number;
};

export default function ScrollReveal({
  text,
  className = '',
  baseOpacity = 0.12,
  blurStrength = 5,
  rotation = 2.5,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const words = useMemo(
    () =>
      text.split(' ').map((w, i) => (
        <span key={`${w}-${i}`} className="sr-word">
          {w}
          {' '}
        </span>
      )),
    [text],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const targets = el.querySelectorAll('.sr-word');

    const tween = gsap.fromTo(
      el,
      { transformOrigin: '0% 50%', rotate: rotation },
      {
        rotate: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom 70%', scrub: true },
      },
    );

    const fade = gsap.fromTo(
      targets,
      { opacity: baseOpacity, filter: `blur(${blurStrength}px)` },
      {
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'none',
        stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top bottom-=20%', end: 'bottom 72%', scrub: true },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      fade.scrollTrigger?.kill();
      tween.kill();
      fade.kill();
    };
  }, [text, baseOpacity, blurStrength, rotation]);

  return (
    <div ref={ref} className={className}>
      {words}
    </div>
  );
}