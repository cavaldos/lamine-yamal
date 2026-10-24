"use client";

import { useRef } from "react";

// Feeds the pointer position to every .glow-card inside, so the card under the
// cursor lights up from exactly where the pointer is.
export default function PointerGlow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={root}
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const card = (e.target as HTMLElement).closest<HTMLElement>(".glow-card");
        if (!card || !root.current?.contains(card)) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
