"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import HighlightCard from "@/components/highlights-page/highlight-card";
import HighlightTheater from "@/components/highlights-page/highlight-theater";
import HighlightToolbar from "@/components/highlights-page/highlight-toolbar";
import { HIGHLIGHTS, type Video } from "@/lib/content";
import { EMPTY_QUERY, queryHighlights, type HighlightQuery } from "@/lib/highlights";
import { useDict } from "@/lib/i18n/provider";

type Open = { videos: Video[]; index: number } | null;

// The interactive part of /highlights: toolbar, grid and the player.
// Clicking a card opens the player at that video, over the filtered list.
export default function HighlightBrowser() {
  const dict = useDict();
  const [query, setQuery] = useState<HighlightQuery>(EMPTY_QUERY);
  const [open, setOpen] = useState<Open>(null);
  const videos = useMemo(() => queryHighlights(query, dict), [query, dict]);

  // Links like /highlights#watch-MZ5z-dLhjUE open that video, once the page has hydrated.
  useEffect(() => {
    const id = window.location.hash.match(/^#watch-([\w-]{11})$/)?.[1];
    const at = HIGHLIGHTS.findIndex((v) => v.youtube === id);
    // The URL can only be read after hydration, so this state is set from an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (at >= 0) setOpen({ videos: HIGHLIGHTS, index: at });
  }, []);

  // Next.js keeps this page alive (hidden) after navigating away; close the
  // player then, so coming back shows the grid, not a stale modal.
  useLayoutEffect(() => () => setOpen(null), []);

  const close = () => {
    setOpen(null);
    if (window.location.hash) history.replaceState(history.state, "", window.location.pathname);
  };

  return (
    <>
      <HighlightToolbar
        query={query}
        onQuery={setQuery}
        count={videos.length}
        total={HIGHLIGHTS.length}
        onPlayAll={() => setOpen({ videos, index: 0 })}
      />

      {videos.length > 0 ? (
        <div className="grid gap-px p-px sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <HighlightCard key={v.youtube} video={v} n={i + 1} onOpen={() => setOpen({ videos, index: i })} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-24 text-center md:px-10">
          <p className="font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong">
            {dict.highlightsPage.noMatch}
          </p>
          <p className="mt-3 text-muted">{dict.common.tryAnother}</p>
          <button
            type="button"
            onClick={() => setQuery({ ...EMPTY_QUERY, sort: query.sort })}
            className="hud-label mt-6 border border-line-strong px-4 py-2.5 text-ink hover:bg-invert-bg hover:text-invert-fg"
          >
            {dict.common.clearFilters}
          </button>
        </div>
      )}

      {/* Keyed so each opening starts fresh. The list is frozen while open. */}
      {open && (
        <HighlightTheater key={open.index} videos={open.videos} start={open.index} onClose={close} />
      )}
    </>
  );
}
