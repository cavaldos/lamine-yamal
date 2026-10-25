"use client";

import { useEffect, useRef } from "react";
import { at, goalTitle, tone, type Goal } from "@/lib/goals";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";

// SVG half-pitch with one dot per goal (size = xG). Goals outside the current
// filter stay as faint dots so the shape of the whole career is still visible.
export default function ShotPitch({
  goals,
  shown,
  focus,
  onHover,
  onSelect,
}: {
  goals: Goal[];
  shown: Set<string>;
  focus: Goal;
  onHover: (g: Goal | null) => void;
  onSelect: (g: Goal) => void;
}) {
  const t = useDict().goals;
  const svg = useRef<SVGSVGElement>(null);

  // Dots pop in the first time the pitch is on screen (see .pitch in globals.css).
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.seen = "true";
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const f = focus.shot ? at(focus.shot) : null;

  return (
    <svg
      ref={svg}
      // Cropped at ~36m from goal: every shot is inside it, so the dots get the space.
      viewBox="-3 -4 74 41"
      className="pitch w-full"
      role="img"
      aria-label={format(t.pitchAria, { count: shown.size })}
      onPointerLeave={() => onHover(null)}
    >
      <defs>
        <pattern id="mow" width="68" height="10.5" patternUnits="userSpaceOnUse">
          <rect width="68" height="5.25" fill="var(--ink)" opacity="0.025" />
        </pattern>
      </defs>
      <g fill="none" stroke="var(--line-strong)" strokeWidth="0.22">
        <rect x="0" y="0" width="68" height="52.5" fill="url(#mow)" />
        <rect x="13.84" y="0" width="40.32" height="16.5" />
        <rect x="24.84" y="0" width="18.32" height="5.5" />
        <rect x="30.34" y="-2" width="7.32" height="2" stroke="var(--ink)" strokeWidth="0.35" />
        <path d="M26.69 16.5 A9.15 9.15 0 0 0 41.31 16.5" />
        <path d="M24.85 52.5 A9.15 9.15 0 0 1 43.15 52.5" />
        <circle cx="34" cy="11" r="0.3" fill="var(--line-strong)" />
      </g>

      {/* Line from the focused shot to the goal mouth. */}
      {f && (
        <line
          x1={f.x}
          y1={f.y}
          x2="34"
          y2="0"
          stroke={tone(focus)}
          strokeWidth="0.25"
          strokeDasharray="0.8 0.6"
          opacity="0.8"
        />
      )}

      {goals.map((g, i) => {
        // Only La Liga goals have a shot position.
        if (!g.shot) return null;
        const p = at(g.shot);
        const on = shown.has(g.id);
        const isFocus = focus.id === g.id;
        const r = 0.55 + g.shot.xg * 1.1;
        return (
          <g
            key={g.id}
            style={{ ["--i" as string]: i }}
            className="cursor-pointer outline-none"
            role="button"
            tabIndex={on ? 0 : -1}
            aria-label={format(t.shotAria, { n: g.n, title: goalTitle(g), minute: g.minute })}
            onPointerEnter={() => on && onHover(g)}
            onFocus={() => on && onHover(g)}
            onBlur={() => onHover(null)}
            onClick={() => on && onSelect(g)}
            onKeyDown={(e) => {
              if (on && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(g);
              }
            }}
          >
            <circle
              className="shot"
              cx={p.x}
              cy={p.y}
              r={r}
              fill={tone(g)}
              stroke="var(--bg)"
              strokeWidth="0.15"
              opacity={on ? (isFocus ? 1 : 0.82) : 0.08}
            />
            {isFocus && on && (
              <circle
                className="shot-ring"
                cx={p.x}
                cy={p.y}
                r={r + 0.75}
                fill="none"
                stroke={tone(g)}
                strokeWidth="0.2"
                opacity="0.7"
              />
            )}
            {/* Generous invisible hit area for fingers. */}
            <circle cx={p.x} cy={p.y} r="2" fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}
