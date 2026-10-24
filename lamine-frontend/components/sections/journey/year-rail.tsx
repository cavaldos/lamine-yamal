import { JOURNEY } from "@/lib/content";

// The list of years down the left edge. The flight marks the current one by
// setting data-active on each <li> directly (no React re-render per frame).
export default function YearRail({
  onJump,
  itemRef,
}: {
  onJump: (i: number) => void;
  itemRef: (i: number, el: HTMLLIElement | null) => void;
}) {
  return (
    <ol className="absolute top-1/2 left-4 z-[60] hidden -translate-y-1/2 flex-col gap-3 md:flex">
      {JOURNEY.map((ch, i) => (
        <li key={i} ref={(el) => itemRef(i, el)} data-active={i === 0} className="group/dot">
          <button
            type="button"
            onClick={() => onJump(i)}
            className="hud-label flex items-center gap-2 text-faint transition-colors duration-200 hover:text-ink group-data-[active=true]/dot:text-ink"
          >
            <span className="h-px w-3 bg-current transition-[width,background-color] duration-300 group-data-[active=true]/dot:w-7 group-data-[active=true]/dot:bg-garnet" />
            {ch.year}
          </button>
        </li>
      ))}
    </ol>
  );
}
