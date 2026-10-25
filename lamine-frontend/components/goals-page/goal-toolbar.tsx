"use client";

import { useEffect, useId, useRef, useState } from "react";
import FilterChips from "@/components/ui/filter-chips";
import { ChevronDown, Film, Play, Search, Swipe, X } from "@/components/ui/icons";
import Select from "@/components/ui/select";
import {
  ALL,
  AREAS,
  COMPETITION_LIST,
  EMPTY_QUERY,
  KINDS,
  SEASONS,
  shortSeason,
  SORTS,
  TEAMS,
  VENUES,
  type GoalQuery,
} from "@/lib/goals";

export type ViewMode = "feed" | "film";

const MODES: [ViewMode, string, typeof Film][] = [
  ["feed", "Thông thường", Swipe],
  ["film", "Liền mạch", Film],
];

// Search, sort, viewing mode and filters. On wide screens the search row sticks
// under the site nav; on phones it scrolls away to leave room for the grid.
export default function GoalToolbar({
  query,
  onQuery,
  count,
  total,
  mode,
  onMode,
  onPlayAll,
}: {
  query: GoalQuery;
  onQuery: (q: GoalQuery) => void;
  count: number;
  total: number;
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  onPlayAll: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<GoalQuery>) => onQuery({ ...query, ...patch });
  const filtered =
    query.season !== ALL ||
    query.comp !== ALL ||
    query.team !== 0 ||
    query.kind !== 0 ||
    query.area !== 0 ||
    query.venue !== 0 ||
    query.q.trim() !== "";
  const activeFilters = [
    query.season !== ALL,
    query.comp !== ALL,
    query.team,
    query.kind,
    query.area,
    query.venue,
  ].filter(Boolean).length;

  // "/" jumps to the search box, as on most sites with search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable], dialog")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The filter panel closes on Escape or a click outside the bar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filters = (
    <div className="flex flex-col gap-3">
      <FilterChips
        label="Mùa giải"
        items={SEASONS.map((s) => (s === ALL ? s : shortSeason(s)))}
        value={SEASONS.indexOf(query.season)}
        onChange={(i) => set({ season: SEASONS[i] })}
      />
      <FilterChips
        label="Giải đấu"
        items={COMPETITION_LIST}
        value={COMPETITION_LIST.indexOf(query.comp)}
        onChange={(i) => set({ comp: COMPETITION_LIST[i] })}
      />
      <FilterChips label="Đội" items={TEAMS.map(([k]) => k)} value={query.team} onChange={(team) => set({ team })} />
      <FilterChips label="Kiểu" items={KINDS.map(([k]) => k)} value={query.kind} onChange={(kind) => set({ kind })} />
      <FilterChips label="Vị trí" items={AREAS.map(([k]) => k)} value={query.area} onChange={(area) => set({ area })} />
      <FilterChips
        label="Sân"
        items={VENUES.map(([k]) => k)}
        value={query.venue}
        onChange={(venue) => set({ venue })}
      />
    </div>
  );

  return (
    <>
      <div className="z-30 border-y border-line bg-bg/95 backdrop-blur md:sticky md:top-12">
        <div ref={bar} className="relative">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 md:px-10">
            <div className="flex h-11 min-w-0 flex-1 basis-full items-center gap-2 border border-line-strong bg-bg-raised pl-3 focus-within:border-accent md:basis-64">
              <Search className="h-4 w-4 shrink-0 text-faint" />
              <input
                ref={input}
                type="search"
                aria-label="Tìm bàn thắng"
                value={query.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Tìm đối thủ, kiến tạo, ngày, phút…"
                className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
              />
              {query.q && (
                <button
                  type="button"
                  onClick={() => set({ q: "" })}
                  aria-label="Xoá tìm kiếm"
                  className="text-faint hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {!query.q && (
                <kbd className="hud-label hidden border border-line px-1.5 text-faint sm:inline">/</kbd>
              )}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((o) => !o)}
                className="hud-label flex h-full items-center gap-2 border-l border-line px-3 text-muted transition-colors hover:text-ink aria-expanded:bg-invert-bg aria-expanded:text-invert-fg"
              >
                Bộ lọc
                {activeFilters > 0 && <span className="text-garnet-ink in-aria-expanded:text-invert-fg">· {activeFilters}</span>}
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </div>

            <Select
              label="Sắp xếp"
              items={SORTS.map(([label]) => label)}
              value={query.sort}
              onChange={(sort) => set({ sort })}
              className="h-11 flex-1 sm:w-56 sm:flex-none"
            />

            <div role="radiogroup" aria-label="Chế độ xem" className="flex h-11 border border-line">
              {MODES.map(([m, label, Icon]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => onMode(m)}
                  className="hud-label flex items-center gap-2 px-3 text-muted transition-colors hover:text-ink aria-checked:bg-invert-bg aria-checked:text-invert-fg"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onPlayAll}
              disabled={count === 0}
              aria-label={`${mode === "film" ? "Phát liền mạch" : "Bắt đầu xem"} ${count} bàn`}
              className="ml-auto inline-flex h-11 items-center gap-2 bg-linear-to-r from-accent to-garnet px-4 font-mono text-[11px] font-bold tracking-[0.12em] text-white uppercase transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{mode === "film" ? "Phát liền mạch" : "Bắt đầu xem"} · </span>
              {count}
            </button>
          </div>

          {open && (
            <div
              id={panelId}
              className="thin-scroll absolute inset-x-0 top-full max-h-[70svh] overflow-y-auto border-y border-line-strong bg-bg-raised px-4 py-5 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)] md:px-10"
            >
              {filters}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 md:px-10">
        <p className="hud-label text-faint" aria-live="polite">
          {count === total ? `${total} bàn thắng` : `${count} / ${total} bàn thắng`}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => onQuery({ ...EMPTY_QUERY, sort: query.sort })}
            className="hud-label text-garnet-ink hover:underline"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>
    </>
  );
}
