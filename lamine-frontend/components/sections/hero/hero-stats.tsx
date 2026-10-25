import CountUp from "@/components/ui/count-up";
import { ALL_GOALS } from "@/lib/goals";
import { PLAYER, TEAM_TITLE_COUNT } from "@/lib/content";

const STATS: [number | string, string][] = [
  ["13 · 07 · 2007", "Ngày sinh"],
  [PLAYER.shirt, "Số áo"],
  [TEAM_TITLE_COUNT, "Danh hiệu tập thể"],
  [ALL_GOALS.length, "Bàn thắng"],
];

// The row of numbers along the bottom of the hero; they count up after the intro.
export default function HeroStats() {
  return (
    <dl
      data-intro="true"
      style={{ animationDelay: "1100ms" }}
      className="relative z-40 mx-auto grid w-full max-w-[1280px] grid-cols-2 border-x border-t border-line bg-bg/88 md:grid-cols-4"
    >
      {STATS.map(([value, label], i) => (
        <div
          key={label}
          className={`border-line px-6 py-4 md:px-10 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t md:border-t-0 md:border-l" : ""}`}
        >
          <dt className="hud-label text-faint">{label}</dt>
          <dd className="mt-1 font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong">
            {typeof value === "string" ? (
              <span className="whitespace-nowrap text-2xl md:text-3xl">{value}</span>
            ) : (
              <CountUp to={value} delay={1200 + i * 90} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
