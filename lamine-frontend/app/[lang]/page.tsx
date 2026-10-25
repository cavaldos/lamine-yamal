import Ruler from "@/components/layout/ruler";
import JsonLd from "@/components/seo/json-ld";
import ArchiveSection from "@/components/sections/archive";
import Closing from "@/components/sections/closing";
import GoalsSection from "@/components/sections/goals";
import HeroSection from "@/components/sections/hero";
import HighlightsSection from "@/components/sections/highlights";
import JourneySection from "@/components/sections/journey";
import Marquee from "@/components/sections/marquee";
import TrophiesSection from "@/components/sections/trophies";

// The page is just the sections in order. When reordering, keep lib/sections.ts
// in the same order: the nav, ruler and section numbers come from there.
// The ruler (the scroll rail on the right) maps these sections, so it lives here
// rather than in the layout.
export default function Home() {
  return (
    <>
      <Ruler />
      <main id="main">
        <JsonLd page="home" />
        <HeroSection />
        <Marquee />
        <TrophiesSection />
        <GoalsSection />
        <HighlightsSection />
        <ArchiveSection />
        <JourneySection />
        <Closing />
      </main>
    </>
  );
}
