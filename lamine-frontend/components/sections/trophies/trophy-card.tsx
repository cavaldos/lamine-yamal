import { Cup } from "@/components/ui/icons";
import type { Trophy } from "@/lib/content";

// Compact card: trophy name, how many times, and each season as a chip.
export default function TrophyCard({ trophy }: { trophy: Trophy }) {
  return (
    <article data-reveal="true" className="glow-card bg-bg p-6 md:p-8">
      <div className="flex items-center justify-between">
        <Cup className="h-6 w-6 text-accent-ink" />
        <p className="font-display text-3xl font-bold tracking-[-0.04em] text-ink-strong">×{trophy.years.length}</p>
      </div>
      <h3 className="mt-8 font-display text-2xl font-medium tracking-[-0.02em] text-ink-strong">{trophy.name}</h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {trophy.years.map((y) => (
          <li key={y} className="hud-label border border-line px-2 py-1 text-muted">
            {y}
          </li>
        ))}
      </ul>
    </article>
  );
}
