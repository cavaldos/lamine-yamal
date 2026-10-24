'use client';

/**
 * SplitText — reactbits.dev/text-animations/split-text, ported to TS.
 * One change from upstream: the root renders as `block`, not `inline-block`.
 * Upstream assumes a centred single line; on a wrapping <h3> inside a grid,
 * inline-block collapses to content width and re-wraps the whole scene.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

type Vars = Record<string, number | string>;

type SplitTextProps = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: Vars;
  to?: Vars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties['textAlign'];
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div';
};

export default function SplitText({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'left',
  tag = 'p',
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const done = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // always async, even when fonts are already in: keeps the setState out of
  // the effect body (cascading render) and document.fonts.ready resolves once
  // the webfont has swapped in, so SplitText never measures the fallback face
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (live) setFontsLoaded(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !fontsLoaded || done.current) return;

      const start = `top ${(1 - threshold) * 100}%${rootMargin.startsWith('-') ? rootMargin : ''}`;
      const split = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self) => {
          const targets =
            (splitType.includes('chars') && self.chars.length && self.chars) ||
            (splitType.includes('words') && self.words.length && self.words) ||
            self.lines;
          return gsap.fromTo(targets, { ...from }, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            force3D: true,
            scrollTrigger: { trigger: el, start, once: true, fastScrollEnd: true },
            onComplete: () => {
              done.current = true;
            },
          });
        },
      });

      return () => {
        ScrollTrigger.getAll().forEach((st) => st.trigger === el && st.kill());
        split.revert();
      };
    },
    {
      scope: ref,
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
      ],
    },
  );

  const Tag = tag;
  return (
    <Tag
      ref={ref as never}
      className={`split-parent ${className}`}
      style={{
        textAlign,
        display: 'block',
        overflow: 'hidden',
        paddingBlock: '0.08em',
        marginBlock: '-0.08em',
      }}
    >
      {text}
    </Tag>
  );
}