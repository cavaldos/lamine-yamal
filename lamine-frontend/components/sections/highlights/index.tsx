import PointerGlow from "@/components/ui/pointer-glow";
import Section, { SectionIntro } from "@/components/ui/section";
import VideoCard from "@/components/ui/video-card";
import { HIGHLIGHTS } from "@/lib/content";
import { h2, serif } from "@/lib/styles";

// Video grid: the first highlight is featured large, the rest fill in around it.
export default function HighlightsSection() {
  const [featured, ...rest] = HIGHLIGHTS;
  return (
    <Section id="highlights">
      <SectionIntro>
        <h2 data-reveal="true" className={h2}>
          Bấm play, <span className={serif}>và xem</span> phép màu.
        </h2>
      </SectionIntro>
      <PointerGlow className="grid gap-px border-t border-line bg-line md:grid-cols-3">
        <div data-reveal="true" className="md:col-span-2 md:row-span-2">
          <VideoCard video={featured} index={0} large />
        </div>
        {rest.map((v, i) => (
          <div key={v.youtube} data-reveal="true">
            <VideoCard video={v} index={i + 1} />
          </div>
        ))}
      </PointerGlow>
    </Section>
  );
}
