'use client';

/**
 * reactbits.dev/text-animations/blur-text — GSAP port.
 * Words fly in sharp-from-blur with a stagger once the block enters view.
 * No hidden initial state in CSS: the text is readable if JS never runs.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { reducedMotion } from '@/lib/motion';

type Props = {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  threshold?: number;
  as?: 'p' | 'div' | 'span';
};

export default function BlurText({
  text,
  className = '',
  delay = 0,
  stagger = 0.06,
  threshold = 0.2,
  as: Tag = 'p',
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll('.bw');
    if (!words.length || reducedMotion()) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        gsap.fromTo(
          words,
          { filter: 'blur(14px)', opacity: 0, yPercent: 30 },
          {
            filter: 'blur(0px)',
            opacity: 1,
            yPercent: 0,
            duration: 1.15,
            delay,
            stagger,
            ease: 'power3.out',
          },
        );
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, delay, stagger, threshold]);

  return (
    <Tag ref={ref as never} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="bw">
          {word}
          {' '}
        </span>
      ))}
    </Tag>
  );
}