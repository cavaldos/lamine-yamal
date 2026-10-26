import { Cup } from "@/components/ui/icons";
import ShuffleText from "@/components/ui/shuffle-text";
import type { Trophy } from "@/lib/content";

// Compact card: trophy name, how many times, and each season as a chip.
export default function TrophyCard({ trophy }: { trophy: Trophy }) {
  return (
    <article data-reveal="true" data-shuffle-host className="glow-card edge-glow bg-bg p-6 md:p-8">
      <div className="flex items-center justify-between">
        <Cup className="h-6 w-6 text-accent-ink" />
        <p className="font-display text-3xl font-bold tracking-[-0.04em] text-accent-ink">×{trophy.years.length}</p>
      </div>
      <h3 className="mt-8 font-display text-2xl leading-[1.2] font-medium tracking-[-0.02em] text-ink-strong">
        <ShuffleText text={trophy.name} />
      </h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {trophy.years.map((y) => (
          <li key={y} className="hud-label border border-line-strong px-2 py-1 text-ink">
            {y}
          </li>
        ))}
      </ul>
    </article>
  );
}
