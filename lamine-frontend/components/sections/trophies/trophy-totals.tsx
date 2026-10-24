import CountUp from "@/components/ui/count-up";
import { AWARDS, COUNTRY_TITLE_COUNT, TEAM_TITLE_COUNT } from "@/lib/content";

const TOTALS: [number, string][] = [
  [TEAM_TITLE_COUNT, "Tập thể"],
  [COUNTRY_TITLE_COUNT, "Đội tuyển"],
  [AWARDS.length, "Cá nhân"],
];

// Three counters beside the section title.
export default function TrophyTotals() {
  return (
    <dl data-reveal="true" className="grid grid-cols-3 gap-px self-end border border-line bg-line">
      {TOTALS.map(([value, label]) => (
        <div key={label} className="bg-bg px-4 py-4">
          <dt className="hud-label text-faint">{label}</dt>
          <dd className="text-blaugrana mt-1 font-display text-5xl font-bold tracking-[-0.04em]">
            <CountUp to={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
