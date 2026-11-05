"use client";

import CountUp from "@/components/ui/count-up";
import { highlightStats } from "@/lib/highlights";
import { useHighlights } from "@/lib/highlights-store";

export type HighlightCountOf = keyof ReturnType<typeof highlightStats>;

// A highlight total that follows the live list (Notion, or the bundled copy before it
// loads), so server components can show it. `animate={false}` prints the plain number.
export default function HighlightCount({
  of = "videos",
  delay,
  animate = true,
}: {
  of?: HighlightCountOf;
  delay?: number;
  animate?: boolean;
}) {
  const n = highlightStats(useHighlights())[of];
  return animate ? <CountUp to={n} delay={delay} /> : n;
}
