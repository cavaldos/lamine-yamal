import AwardList from "@/components/sections/trophies/award-list";
import FeaturedTrophy from "@/components/sections/trophies/featured-trophy";
import TrophyCard from "@/components/sections/trophies/trophy-card";
import TrophyTotals from "@/components/sections/trophies/trophy-totals";
import PointerGlow from "@/components/ui/pointer-glow";
import Section from "@/components/ui/section";
import { TROPHIES } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Trophy cabinet: totals, the two headline titles, club titles, then individual awards.
// The data lives in TROPHIES / AWARDS in lib/content.ts.
export default async function TrophiesSection() {
  const { trophies } = await getDictionary();
  return (
    <Section id="trophies">
      <TrophyTotals />

      <PointerGlow className="grid gap-px border-t border-line bg-line md:grid-cols-2">
        {TROPHIES.filter((t) => t.featured).map((t) => (
          <FeaturedTrophy
            key={t.id}
            trophy={t}
            holder={t.scope === "country" ? trophies.spainTeam : trophies.club}
            note={trophies.notes[t.id as keyof typeof trophies.notes]}
          />
        ))}
      </PointerGlow>

      <PointerGlow className="grid gap-px border-t border-line bg-line md:grid-cols-3">
        {TROPHIES.filter((t) => !t.featured).map((t) => (
          <TrophyCard key={t.id} trophy={t} />
        ))}
      </PointerGlow>

      <AwardList />
    </Section>
  );
}
