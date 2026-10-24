"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Film, LinkIcon, Volume, VolumeOff } from "@/components/ui/icons";
import { watchUrl, type Goal, type GoalVideo } from "@/lib/goals";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/goals#goal-${goal.n}`);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Action label={muted ? "Bật tiếng" : "Tắt tiếng"}>
        <button type="button" onClick={onMute} aria-label={muted ? "Bật tiếng" : "Tắt tiếng"} className={btn}>
          {muted ? <VolumeOff className="h-5 w-5" /> : <Volume className="h-5 w-5" />}
        </button>
      </Action>
      <Action label="Liền mạch">
        <button type="button" onClick={onFilm} aria-label="Xem liền mạch từ bàn này" className={btn}>
          <Film className="h-5 w-5" />
        </button>
      </Action>
      <Action label={copied ? "Đã chép" : "Chia sẻ"}>
        <button type="button" onClick={copy} aria-label="Chép link bàn thắng" className={btn}>
          <LinkIcon className="h-5 w-5" />
        </button>
      </Action>
      <Action label="YouTube">
        <a href={watchUrl(video)} target="_blank" rel="noreferrer" aria-label="Mở trên YouTube" className={btn}>
          <ArrowUpRight className="h-5 w-5" />
        </a>
      </Action>
    </div>
  );
}
