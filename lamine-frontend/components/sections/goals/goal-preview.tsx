"use client";

import { useEffect, useRef, useState } from "react";
import HoverPreview from "@/components/ui/hover-preview";
import { goalVideo, type Goal } from "@/lib/goals";

const W = 320;
const H = 180;
const GAP = 18;
const DELAY = 1000;

// A muted clip of the hovered goal in a tooltip that follows the cursor. The 2s delay
// keeps a cursor sweeping across the dots from loading every clip it passes.
export default function GoalPreview({ goal }: { goal: Goal | null }) {
  const [shown, setShown] = useState<Goal | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  const place = () => {
    const el = box.current;
    if (!el) return;
    // Right of and below the cursor; flip to the other side when it would leave the viewport.
    let x = pos.current.x + GAP;
    let y = pos.current.y + GAP;
    if (x + W > window.innerWidth - 8) x = pos.current.x - GAP - W;
    if (y + H > window.innerHeight - 8) y = pos.current.y - GAP - H;
    el.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  };

  useEffect(() => {
    const t = window.setTimeout(() => setShown(goal), goal ? DELAY : 0);
    return () => window.clearTimeout(t);
  }, [goal]);

  useEffect(() => {
    if (!goal) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.current = { x: e.clientX, y: e.clientY };
      place();
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [goal]);

  useEffect(place, [shown]);

  if (!shown) return null;
  const v = goalVideo(shown);

  return (
    <div
      ref={box}
      aria-hidden
      style={{ width: W, height: H }}
      className="pointer-events-none fixed top-0 left-0 z-50 overflow-hidden border border-line-strong bg-black shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
    >
      <HoverPreview key={shown.id} id={v.id} start={v.start} end={v.end} vertical={v.vertical} cover />
    </div>
  );
}
