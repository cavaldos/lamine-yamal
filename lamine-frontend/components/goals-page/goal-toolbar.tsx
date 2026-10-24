"use client";

import { useEffect, useRef } from "react";
import FilterChips from "@/components/ui/filter-chips";
import { ChevronDown, Film, Play, Search, Swipe, X } from "@/components/ui/icons";
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
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 md:px-10">
          <label className="flex h-11 min-w-0 flex-1 basis-full items-center md:basis-64 gap-2 border border-line-strong bg-bg-raised px-3 focus-within:border-accent">
            <Search className="h-4 w-4 shrink-0 text-faint" />
            <span className="sr-only">Tìm bàn thắng</span>
            <input
              ref={input}
              type="search"
              value={query.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Tìm đối thủ, kiến tạo, ngày, phút…"
              className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
            />
            {query.q ? (
              <button
                type="button"
                onClick={() => set({ q: "" })}
                aria-label="Xoá tìm kiếm"
                className="text-faint hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hud-label hidden border border-line px-1.5 text-faint sm:inline">/</kbd>
            )}
          </label>

          <label className="relative flex h-11 flex-1 items-center border border-line bg-bg-raised sm:flex-none">
            <span className="sr-only">Sắp xếp</span>
            <select
              value={query.sort}
              onChange={(e) => set({ sort: Number(e.target.value) })}
              className="hud-label h-full w-full appearance-none bg-transparent pr-9 pl-3 text-muted outline-none"
            >
              {SORTS.map(([label], i) => (
                <option key={label} value={i} className="bg-bg-raised text-ink">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-faint" />
          </label>

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

        {/* On phones the filters fold into the sticky bar. */}
        <details className="group border-t border-line md:hidden">
          <summary className="hud-label flex cursor-pointer list-none items-center justify-between px-4 py-3 text-muted [&::-webkit-details-marker]:hidden">
            Bộ lọc
            {activeFilters > 0 && <span className="text-garnet-ink"> · {activeFilters}</span>}
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="thin-scroll max-h-[50svh] overflow-y-auto px-4 pb-4">{filters}</div>
        </details>
      </div>

      {/* On wide screens they sit open below it and scroll away. */}
      <div className="hidden border-b border-line px-10 py-5 md:block">{filters}</div>

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
