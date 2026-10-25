"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Film, LinkIcon, Volume, VolumeOff } from "@/components/ui/icons";
import { watchUrl, type Goal, type GoalVideo } from "@/lib/goals";
import { localePath } from "@/lib/i18n/config";
import { useDict, useLocale } from "@/lib/i18n/provider";

const btn =
  "flex h-12 w-12 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20 md:bg-white/10";

function Action({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <span className="text-[11px] font-medium text-white/80 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">{label}</span>
    </div>
  );
}

// The column of round buttons beside each clip.
export default function FeedRail({
  goal,
  video,
  muted,
  onMute,
  onFilm,
  className = "",
}: {
  goal: Goal;
  video: GoalVideo;
  muted: boolean;
  onMute: () => void;
  onFilm: () => void;
  className?: string;
}) {
  const dict = useDict();
  const t = dict.goalsPage;
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${localePath(locale, "/goals")}#goal-${goal.n}`);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Action label={muted ? dict.common.unmute : dict.common.mute}>
        <button type="button" onClick={onMute} aria-label={muted ? dict.common.unmute : dict.common.mute} className={btn}>
          {muted ? <VolumeOff className="h-5 w-5" /> : <Volume className="h-5 w-5" />}
        </button>
      </Action>
      <Action label={t.railFilm}>
        <button type="button" onClick={onFilm} aria-label={t.railFilmAria} className={btn}>
          <Film className="h-5 w-5" />
        </button>
      </Action>
      <Action label={copied ? t.railCopied : t.railShare}>
        <button type="button" onClick={copy} aria-label={t.railCopyAria} className={btn}>
          <LinkIcon className="h-5 w-5" />
        </button>
      </Action>
      <Action label="YouTube">
        <a href={watchUrl(video)} target="_blank" rel="noreferrer" aria-label={t.railYoutubeAria} className={btn}>
          <ArrowUpRight className="h-5 w-5" />
        </a>
      </Action>
    </div>
  );
}
