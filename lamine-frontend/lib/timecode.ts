// Video times as people type them, and back. No imports: scripts/notion-sync.mts
// loads this file directly through lib/notion/goal-schema.ts.

// One time → seconds, or undefined when it isn't one.
//   "6:43" / "06:43" → 403     "1:02:30" → 3750     "75:20" → 4520 (minutes may pass 59)
//   "403" / "403s" → 403       "6m43s" → 403        "1h2m30s" → 3750 (YouTube's ?t= style)
export function parseTimecode(value: string): number | undefined {
  const v = value.trim().toLowerCase();
  const clock = v.match(/^(\d+)(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
  if (clock) {
    const [first, ...rest] = clock.slice(1).filter((p) => p !== undefined).map(Number);
    if (rest.some((n) => n > 59)) return undefined;
    return rest.reduce((total, n) => total * 60 + n, first);
  }
  const units = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!v || !units) return undefined;
  return Number(units[1] ?? 0) * 3600 + Number(units[2] ?? 0) * 60 + Number(units[3] ?? 0);
}

export type ClipRange = { start: number; end?: number };

// The "Clip Time" column: start and end, with any separator between them.
//   "06:43, 7:34" / "6:43 - 7:34" / "6:43 → 7:34" → { start: 403, end: 454 }
//   "1:02:30, 1:03:10"                          → { start: 3750, end: 3790 }
//   "6:43"                                      → { start: 403 } (plays to the end)
// An end at or before the start is dropped. Empty or unreadable → null.
export function parseClipRange(value: string | null | undefined): ClipRange | null {
  const [start, end] = (value?.toLowerCase().match(/\d[\d:hms]*/g) ?? []).map(parseTimecode);
  if (start === undefined) return null;
  return end !== undefined && end > start ? { start, end } : { start };
}

// Seconds → "6:43", or "1:02:30" from an hour up.
export function formatTimecode(seconds: number) {
  const t = Math.max(0, Math.floor(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

// The inverse of parseClipRange: { start: 403, end: 454 } → "6:43, 7:34".
export const formatClipRange = (start = 0, end?: number) =>
  end === undefined ? formatTimecode(start) : `${formatTimecode(start)}, ${formatTimecode(end)}`;
