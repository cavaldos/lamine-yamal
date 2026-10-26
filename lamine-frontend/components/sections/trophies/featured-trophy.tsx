import { Cup } from "@/components/ui/icons";
import ShuffleText from "@/components/ui/shuffle-text";
import type { Trophy } from "@/lib/content";

// Large card for the headline titles (World Cup, EURO), with the year in outline behind.
export default function FeaturedTrophy({
  trophy,
  holder,
  note,
}: {
  trophy: Trophy;
  holder: string; // who won it: the national team or the club
  note?: string;
}) {
  const year = trophy.years[0];
  return (
    <article data-reveal="true" data-shuffle-host className="glow-card lift overflow-hidden bg-bg p-6 md:p-10">
      {/* Behind the text (z -1) and faded out on the left, so its strokes never cross the title. */}
      <p
        aria-hidden
        className="text-outline pointer-events-none absolute -right-2 -bottom-6 -z-10 font-display text-[9rem] leading-none font-bold tracking-[-0.05em] [mask-image:linear-gradient(to_right,transparent,black_70%)] md:text-[11rem]"
      >
        {year}
      </p>
      <div className="flex items-start justify-between gap-6">
        <span className="flex h-14 w-14 items-center justify-center border border-gold/40 text-gold">
          <Cup className="h-7 w-7" />
        </span>
        <p className="hud-label text-right text-faint">
          {holder}
          <span className="mt-2 block text-sm text-gold">{year}</span>
        </p>
      </div>
      <h3 className="mt-10 font-display text-3xl leading-[1.15] font-medium tracking-[-0.03em] text-ink-strong sm:text-4xl md:text-5xl">
        <ShuffleText text={trophy.name} />
      </h3>
      {note && <p className="mt-2 max-w-md text-ink/80">{note}</p>}
    </article>
  );
}
