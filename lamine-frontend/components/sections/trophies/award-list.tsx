import { Medal } from "@/components/ui/icons";
import { AWARDS } from "@/lib/content";

// Individual awards as a single strip of medals.
export default function AwardList() {
  return (
    <ul className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
      {AWARDS.map(([name, year]) => (
        <li key={name} data-reveal="true" className="flex items-center gap-4 bg-bg px-6 py-5">
          <Medal className="h-6 w-6 shrink-0 text-gold" />
          <div>
            <p className="leading-tight text-ink">{name}</p>
            <p className="hud-label mt-1 text-faint">{year}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
