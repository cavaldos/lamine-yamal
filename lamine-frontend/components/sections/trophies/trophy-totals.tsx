import CountUp from "@/components/ui/count-up";
import { AWARDS, COUNTRY_TITLE_COUNT } from "@/lib/content";

// The club total is already in the hero, so only the other two are counted here.
const TOTALS: [number, string][] = [
  [COUNTRY_TITLE_COUNT, "Danh hiệu đội tuyển quốc gia"],
  [AWARDS.length, "Danh hiệu cá nhân"],
];

// A row of two counters under the section header.
export default function TrophyTotals() {
  return (
    <dl data-reveal="true" className="grid grid-cols-2 gap-px bg-line">
      {TOTALS.map(([value, label]) => (
        <div key={label} className="bg-bg px-6 py-5 md:px-10">
          <dt className="hud-label text-faint">{label}</dt>
          <dd className="text-blaugrana mt-1 font-display text-5xl font-bold tracking-[-0.04em]">
            <CountUp to={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
