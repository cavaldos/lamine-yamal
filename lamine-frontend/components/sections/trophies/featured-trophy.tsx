import { Cup } from "@/components/ui/icons";
import type { Trophy } from "@/lib/content";

// Large card for the headline titles (World Cup, EURO), with the year in outline behind.
export default function FeaturedTrophy({ trophy }: { trophy: Trophy }) {
  return (
    <article data-reveal="true" className="glow-card lift overflow-hidden bg-bg p-6 md:p-10">
      <div className="flex items-start justify-between gap-6">
        <span className="flex h-14 w-14 items-center justify-center border border-gold/40 text-gold">
          <Cup className="h-7 w-7" />
        </span>
        <p className="hud-label text-faint">
          {trophy.scope === "country" ? "Đội tuyển Tây Ban Nha" : "FC Barcelona"}
        </p>
      </div>
      <h3 className="mt-10 font-display text-4xl font-medium tracking-[-0.03em] text-ink-strong md:text-5xl">
        {trophy.name}
      </h3>
      {trophy.note && <p className="mt-2 text-muted">{trophy.note}</p>}
      <p
        aria-hidden
        className="text-outline pointer-events-none absolute -right-2 -bottom-6 font-display text-[9rem] leading-none font-bold tracking-[-0.05em] md:text-[11rem]"
      >
        {trophy.years[0]}
      </p>
    </article>
  );
}
