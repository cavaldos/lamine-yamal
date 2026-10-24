'use client';

/**
 * DepthText — port of reactbits.dev/text-animations/depth-text.
 * Deviation from upstream, all deliberate:
 *  - TS types instead of .jsx
 *  - CSS moved to globals.css (no per-component css import)
 *  - rAF loop gated by IntersectionObserver: 30+ layers re-rendering on every
 *    frame while the section is off-screen is the one way this component can
 *    make a page *less* smooth
 *  - theme defaults (chalk face / grana depth) and fontSize:"inherit" so the
 *    caller's type scale stays the single source of truth
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

type DepthTextProps = {
  text: string;
  layers?: number;
  depth?: number;
  faceColor?: string;
  depthColor?: string;
  tilt?: number;
  smoothing?: number;
  perspective?: number;
  autoOrbit?: boolean;
  orbitSpeed?: number;
  fontSize?: string;
  fontWeight?: number;
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
};

export default function DepthText({
  text,
  layers = 30,
  depth = 2.4,
  faceColor = '#e9ecf4',
  depthColor = '#a50044',
  tilt = 7.5,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.35,
  fontSize = 'inherit',
  fontWeight = 800,
  shadow = true,
  className = '',
  style,
}: DepthTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  const n = clamp(Math.round(layers) || 2, 2, 64);
  const step = clamp(depth, 0, 12);
  const maxTilt = clamp(tilt, 0, 12);
  const ease = clamp(smoothing, 0.02, 0.35);
  const speed = clamp(orbitSpeed, 0, 2);

  const base = useMemo(() => ({ x: -maxTilt * 0.32, y: maxTilt * 0.42 }), [maxTilt]);

  const stack = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const index = n - i;
        const eased = (index / n) ** 2;
        const mix = Math.round((1 - eased) * 72 + 4);
        return {
          index,
          color: `color-mix(in srgb, ${faceColor} ${mix}%, ${depthColor})`,
          transform: `translateZ(${-index * step}px)`,
        };
      }),
    [n, step, faceColor, depthColor],
  );

  // Only spin while visible — the whole point of the gate.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), {
      rootMargin: '200px',
    });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const track = !reduced && fine;

    const write = (x: number, y: number) => {
      stage.style.transform = `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`;
    };

    if (reduced || !onScreen) {
      write(reduced ? base.x : 0, reduced ? base.y : 0);
      if (reduced || !autoOrbit) return;
    }

    let raf = 0;
    let engaged = false;
    const start = performance.now();
    const current = { ...base };
    const target = { ...base };

    const move = (e: PointerEvent) => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r?.width || !r.height) return;
      engaged = true;
      const x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 0.8), -1, 1);
      const y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 0.8), -1, 1);
      target.x = base.x - y * maxTilt;
      target.y = base.y + x * maxTilt;
    };
    const leave = () => {
      engaged = false;
      target.x = base.x;
      target.y = base.y;
    };

    if (track) {
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('blur', leave);
    }

    const tick = (now: number) => {
      if (!engaged && autoOrbit) {
        const orbit = ((now - start) / 1000) * speed * Math.PI * 2;
        const amt = track ? 0.18 : 0.55;
        target.x = base.x + Math.sin(orbit) * maxTilt * amt;
        target.y = base.y + Math.cos(orbit * 0.85) * maxTilt * amt;
      }
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      write(current.x, current.y);
      raf = requestAnimationFrame(tick);
    };

    write(current.x, current.y);
    raf = requestAnimationFrame(tick);

    return () => {
      if (track) {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('blur', leave);
      }
      cancelAnimationFrame(raf);
    };
  }, [onScreen, autoOrbit, speed, ease, maxTilt, base]);

  return (
    <span
      ref={rootRef}
      className={`depth-text ${className}`.trim()}
      style={
        {
          ...style,
          '--depth-text-perspective': `${perspective}px`,
          '--depth-text-font-size': fontSize,
          '--depth-text-font-weight': fontWeight,
          '--depth-text-face-color': faceColor,
          '--depth-text-depth-color': depthColor,
          '--depth-text-shadow': shadow
            ? `0 22px 34px color-mix(in srgb, ${depthColor} 36%, transparent), 0 4px 8px rgb(0 0 0 / 0.28)`
            : 'none',
        } as CSSProperties
      }
    >
      <span ref={stageRef} className="depth-text__stage">
        {stack.map((layer) => (
          <span
            aria-hidden="true"
            key={layer.index}
            className="depth-text__layer"
            style={{ color: layer.color, transform: layer.transform }}
          >
            {text}
          </span>
        ))}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  );
}