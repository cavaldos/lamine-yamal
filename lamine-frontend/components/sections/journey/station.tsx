import PhotoFrame from "@/components/ui/photo-frame";
import type { LocalizedChapter } from "@/lib/content";

// One chapter card: photo on one side, date/title/story/stat on the other.
// Odd chapters flip sides so the flight zig-zags. Compact on phones, where the
// flight has one short screen to show the whole card.
export default function Station({ chapter, index }: { chapter: LocalizedChapter; index: number }) {
  const flip = index % 2 === 1;
  return (
    <article className="grid overflow-hidden border border-line-strong bg-bg-raised/95 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)] md:grid-cols-2">
      <PhotoFrame
        src={chapter.photo}
        alt={chapter.title}
        year={chapter.year}
        className={`aspect-[2/1] sm:aspect-[16/9] md:aspect-auto md:min-h-[360px] ${flip ? "md:order-2" : ""}`}
      />
      <div className="flex flex-col justify-between gap-4 p-4 sm:gap-6 sm:p-5 md:p-8">
        <div>
          <p className="hud-label text-garnet-ink">{chapter.date}</p>
          <h3 className="mt-2 font-display text-2xl leading-[1.05] font-medium tracking-[-0.03em] text-ink-strong sm:mt-3 md:text-4xl">
            {chapter.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px] md:text-base">{chapter.body}</p>
        </div>
        {chapter.stat && (
          <p className="flex items-baseline gap-3 border-t border-line pt-4">
            <span className="text-blaugrana font-display text-4xl leading-none font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              {chapter.stat}
            </span>
            <span className="hud-label text-muted">{chapter.statLabel}</span>
          </p>
        )}
      </div>
    </article>
  );
}
