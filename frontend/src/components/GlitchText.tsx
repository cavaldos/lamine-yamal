'use client';

/**
 * reactbits.dev/text-animations/glitch-text — CSS only, zero JS.
 * Two clipped copies of the text on the data-text attribute jitter on their
 * own timings. CSS animation is killed by the global reduced-motion block.
 */

type Props = {
  children: string;
  className?: string;
  speed?: number;
  onHover?: boolean;
};

export default function GlitchText({ children, className = '', speed = 1.6, onHover = true }: Props) {
  return (
    <span
      data-text={children}
      style={
        {
          '--glitch-after': `${speed * 3}s`,
          '--glitch-before': `${speed * 2}s`,
        } as React.CSSProperties
      }
      className={`glitch${onHover ? ' glitch-hover' : ''} ${className}`}
    >
      {children}
    </span>
  );
}