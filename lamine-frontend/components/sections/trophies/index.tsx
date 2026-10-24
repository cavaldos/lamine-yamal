import AwardList from "@/components/sections/trophies/award-list";
import FeaturedTrophy from "@/components/sections/trophies/featured-trophy";
import TrophyCard from "@/components/sections/trophies/trophy-card";
import TrophyTotals from "@/components/sections/trophies/trophy-totals";
import PointerGlow from "@/components/ui/pointer-glow";
import Section from "@/components/ui/section";
import { TROPHIES } from "@/lib/content";
import { h2, lead, serif } from "@/lib/styles";

// Trophy cabinet: totals, the two headline titles, club titles, then individual awards.
// The data lives in TROPHIES / AWARDS in lib/content.ts.
export default function TrophiesSection() {
  return (
    <Section id="trophies">
      <div className="grid gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr] md:px-10 md:py-20">
        <div>
          <h2 data-reveal="true" className={h2}>
            Tủ kính <span className={serif}>của tuổi</span> mười chín.
          </h2>
          <p data-reveal="true" className={lead}>
            Vô địch châu Âu, vô địch thế giới, ba lần vô địch La Liga — tất cả trước sinh nhật tuổi 20.
          </p>
        </div>
        <TrophyTotals />
      </div>

      <PointerGlow className="grid gap-px border-t border-line bg-line md:grid-cols-2">
        {TROPHIES.filter((t) => t.featured).map((t) => (
          <FeaturedTrophy key={t.name} trophy={t} />
        ))}
      </PointerGlow>

      <PointerGlow className="grid gap-px border-t border-line bg-line md:grid-cols-3">
        {TROPHIES.filter((t) => !t.featured).map((t) => (
          <TrophyCard key={t.name} trophy={t} />
        ))}
      </PointerGlow>

      <AwardList />
    </Section>
  );
}
