import CountUp from "@/components/ui/count-up";
import { AWARDS, COUNTRY_TITLE_COUNT } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// The club total is already in the hero, so only the other two are counted here.
// A row of two counters under the section header.
export default async function TrophyTotals() {
  const { trophies } = await getDictionary();
  const totals: [number, string][] = [
    [COUNTRY_TITLE_COUNT, trophies.countryTitles],
    [AWARDS.length, trophies.individualAwards],
  ];
  return (
    <dl data-reveal="true" className="grid grid-cols-2 gap-px bg-line">
      {totals.map(([value, label]) => (
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
