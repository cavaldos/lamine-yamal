"use client";

import { useEffect, useState } from "react";

type Layer = { id: number; text: string; enter: boolean; leaving: boolean };

// Text that morphs into its next value instead of being swapped: the old text
// blurs and lifts away while the new one settles in. The old layer is taken
// out of flow, so the new text keeps the layout and a quick run of changes
// (hovering across a map) overlaps smoothly instead of restarting.
export default function MorphText({ value, className = "" }: { value: string; className?: string }) {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, text: value, enter: false, leaving: false }]);
  const current = layers.find((l) => !l.leaving);

  // Adjust state during render when the prop changes, rather than in an effect.
  if (current && current.text !== value) {
    const next: Layer = { id: current.id + 1, text: value, enter: true, leaving: false };
    setLayers([...layers.map((l) => ({ ...l, leaving: true })), next].slice(-3));
  }

  // Backstop: if an old layer's animation never ends (animations off, stylesheet not
  // loaded yet), drop it anyway, or it would sit on top of the new text for good.
  const fading = layers.some((l) => l.leaving);
  useEffect(() => {
    if (!fading) return;
    const t = window.setTimeout(() => setLayers((ls) => ls.filter((l) => !l.leaving)), 600);
    return () => window.clearTimeout(t);
  }, [fading, layers]);

  return (
    <span className="relative block">
      <span className="sr-only">{value}</span>
      {layers.map((l) => (
        <span
          key={l.id}
          aria-hidden
          onAnimationEnd={() => l.leaving && setLayers((ls) => ls.filter((x) => x.id !== l.id))}
          className={`block ${className} ${l.leaving ? "morph-out absolute inset-x-0 top-0" : l.enter ? "morph-in" : ""}`}
        >
          {l.text}
        </span>
      ))}
    </span>
  );
}
