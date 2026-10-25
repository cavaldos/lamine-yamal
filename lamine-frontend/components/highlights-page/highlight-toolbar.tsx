"use client";

import { useEffect, useRef } from "react";
import { Play, Search, X } from "@/components/ui/icons";
import Select from "@/components/ui/select";
import { EMPTY_QUERY, sortLabels, sourceLabels, type HighlightQuery } from "@/lib/highlights";
import { format } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/provider";

// Search, source, sort and "play all". On wide screens the bar sticks under the
// site nav; on phones it scrolls away to leave room for the grid.
export default function HighlightToolbar({
  query,
  onQuery,
  count,
  total,
  onPlayAll,
}: {
  query: HighlightQuery;
  onQuery: (q: HighlightQuery) => void;
  count: number;
  total: number;
  onPlayAll: () => void;
}) {
  const dict = useDict();
  const t = dict.highlightsPage;
  const input = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<HighlightQuery>) => onQuery({ ...query, ...patch });
  const filtered = query.source !== 0 || query.q.trim() !== "";

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

  return (
    <>
      <div className="z-30 border-y border-line bg-bg/95 backdrop-blur md:sticky md:top-12">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 md:px-10">
          <div className="flex h-11 min-w-0 flex-1 basis-full items-center gap-2 border border-line-strong bg-bg-raised pl-3 focus-within:border-accent md:basis-64">
            <Search className="h-4 w-4 shrink-0 text-faint" />
            <input
              ref={input}
              type="search"
              aria-label={t.searchAria}
              value={query.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder={t.searchPlaceholder}
              className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
            />
            {query.q ? (
              <button
                type="button"
                onClick={() => set({ q: "" })}
                aria-label={dict.common.clearSearch}
                className="pr-3 text-faint hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hud-label mr-3 hidden border border-line px-1.5 text-faint sm:inline">/</kbd>
            )}
          </div>

          <Select
            label={t.source}
            items={sourceLabels(dict)}
            value={query.source}
            onChange={(source) => set({ source })}
            className="h-11 flex-1 sm:w-48 sm:flex-none"
          />
          <Select
            label={t.sort}
            items={sortLabels(dict)}
            value={query.sort}
            onChange={(sort) => set({ sort })}
            className="h-11 flex-1 sm:w-40 sm:flex-none"
          />

          <button
            type="button"
            onClick={onPlayAll}
            disabled={count === 0}
            aria-label={format(t.playAria, { count })}
            className="ml-auto inline-flex h-11 items-center gap-2 bg-linear-to-r from-accent to-garnet px-4 font-mono text-[11px] font-bold tracking-[0.12em] text-white uppercase transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.playFilm} · </span>
            {count}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 md:px-10">
        <p className="hud-label text-faint" aria-live="polite">
          {count === total ? format(t.count, { count: total }) : format(t.countOf, { count, total })}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => onQuery({ ...EMPTY_QUERY, sort: query.sort })}
            className="hud-label text-garnet-ink hover:underline"
          >
            {dict.common.clearFilters}
          </button>
        )}
      </div>
    </>
  );
}
