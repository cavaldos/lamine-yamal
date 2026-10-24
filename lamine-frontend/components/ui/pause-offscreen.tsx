"use client";

import { useEffect, useRef } from "react";

// A div whose CSS animations pause while it is off screen (see [data-offscreen]
// in globals.css). Endless loops otherwise keep the browser working for nothing.
// The attribute is only set from this component's own effect, i.e. after it has
// hydrated, so the server HTML and the client never disagree.
export default function PauseOffscreen(props: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-offscreen", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} {...props} />;
}
