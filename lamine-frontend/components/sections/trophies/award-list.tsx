import { Medal } from "@/components/ui/icons";
import ShuffleText from "@/components/ui/shuffle-text";
import { AWARDS } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Individual awards as a single strip of medals.
export default async function AwardList() {
  const { trophies } = await getDictionary();
  return (
    <ul className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
      {AWARDS.map(({ id, year }) => (
        <li key={id} data-reveal="true" data-shuffle-host className="flex items-center gap-4 bg-bg px-6 py-5">
          <Medal className="h-6 w-6 shrink-0 text-gold" />
          <div>
            <p className="leading-tight text-ink">
              <ShuffleText text={trophies.awards[id]} />
            </p>
            <p className="hud-label mt-1 text-faint">{year}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
