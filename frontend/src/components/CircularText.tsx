'use client';

/**
 * reactbits.dev/text-animations/circular-text — CSS port.
 * Letters are pinned around a circle with a rotate+translateZ per letter, and
 * the whole stage spins on one keyframe. Hover speeds the spin up via a
 * variable, no JS.
 */

import { type CSSProperties } from 'react';

type Props = {
  text: string;
  className?: string;
  size?: number;
  spin?: number;
};

export default function CircularText({ text, className = '', size = 168, spin = 26 }: Props) {
  const letters = Array.from(text);

  return (
    <span
      className={`circular ${className}`}
      style={
        {
          '--circ-size': `${size}px`,
          '--circ-spin': `${spin}s`,
          '--circ-count': letters.length,
        } as CSSProperties
      }
    >
      <span className="circular-stage" aria-hidden="true">
        {letters.map((c, i) => (
          <span key={i} className="circular-letter" style={{ '--i': i } as CSSProperties}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}