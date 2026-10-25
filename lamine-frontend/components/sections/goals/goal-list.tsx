"use client";

import { useEffect, useRef } from "react";
import { fmtDate, tone, type Goal } from "@/lib/goals";
import { useDict } from "@/lib/i18n/provider";

// Scrollable list of the filtered goals, newest first.
export default function GoalList({
  goals,
  selectedId,
  onSelect,
  onHover,
}: {
  goals: Goal[];
  selectedId: string;
  onSelect: (g: Goal) => void;
  onHover: (g: Goal | null) => void;
}) {
  const { goals: t } = useDict();
  const list = useRef<HTMLOListElement>(null);

  // Keep the selected row in view inside the list (never scrolls the page).
  useEffect(() => {
    const box = list.current;
    const row = box?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    if (box && row)
      box.scrollTo({ top: row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2, behavior: "smooth" });
  }, [selectedId]);

  return (
    <ol
      ref={list}
      data-lenis-prevent
      className="thin-scroll relative max-h-[340px] flex-1 overflow-y-auto overscroll-contain"
    >
      {goals
        .slice()
        .reverse()
        .map((g) => (
          <li key={g.id} data-id={g.id}>
            <button
              type="button"
              onClick={() => onSelect(g)}
              onPointerEnter={() => onHover(g)}
              onPointerLeave={() => onHover(null)}
              data-active={selectedId === g.id}
              className="grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-line px-6 py-3 text-left transition-colors duration-150 hover:bg-bg-raised data-[active=true]:bg-bg-raised md:px-8"
            >
              <span className="hud-label text-faint">#{g.n}</span>
              <span className="min-w-0 truncate">
                <span className="text-ink">{g.opponent}</span>
                <span className="ml-2 text-sm text-faint">{fmtDate(g.date)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="hud-label text-muted">{g.minute}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: tone(g) }} />
              </span>
            </button>
          </li>
        ))}
      {goals.length === 0 && <li className="px-8 py-10 text-muted">{t.listEmpty}</li>}
    </ol>
  );
}
