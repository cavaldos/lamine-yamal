import { goalTitle, type Goal } from "@/lib/goals";

// The reel's timeline: one segment per goal. Finished goals are full, the
// playing one fills as it plays (driven through `fillRef`), later ones are empty.
// Clicking a segment jumps to that goal.
export default function FilmProgress({
  goals,
  index,
  fillRef,
  onJump,
}: {
  goals: Goal[];
  index: number;
  fillRef: React.RefObject<HTMLSpanElement | null>;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex h-5 items-center gap-[2px]" role="group" aria-label="Tiến trình thước phim">
      {goals.map((g, i) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onJump(i)}
          aria-label={`Bàn #${g.n} ${goalTitle(g)}`}
          aria-current={i === index ? "step" : undefined}
          className="group/seg relative flex h-full min-w-0 flex-1 items-center"
        >
          <span
            className={`relative block w-full overflow-hidden rounded-full bg-white/20 transition-[height] duration-150 group-hover/seg:h-[7px] ${
              i === index ? "h-[5px]" : "h-[3px]"
            }`}
          >
            <span
              ref={i === index ? fillRef : undefined}
              className="absolute inset-0 origin-left bg-linear-to-r from-accent via-garnet to-gold"
              style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
            />
          </span>
          <span
            className={`hud-label pointer-events-none absolute bottom-full mb-2 hidden bg-black/85 ${
              // Keep the label on screen at either end of the bar.
              i < goals.length * 0.15 ? "left-0" : i > goals.length * 0.85 ? "right-0" : "left-1/2 -translate-x-1/2"
            } px-2 py-1 whitespace-nowrap text-white group-hover/seg:block`}
          >
            #{g.n} · {goalTitle(g)} · {g.minute}
          </span>
        </button>
      ))}
    </div>
  );
}
