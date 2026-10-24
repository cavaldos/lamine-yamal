import PointerGlow from "@/components/ui/pointer-glow";
import Section from "@/components/ui/section";
import VideoCard from "@/components/ui/video-card";
import { CHILDHOOD_VIDEOS } from "@/lib/content";

// Youth-era footage, continuing the archive section after the photo reel.
export default function ChildhoodVideos() {
  return (
    <Section>
      <div className="flex items-end justify-between gap-6 border-t border-line px-6 py-10 md:px-10">
        <h3 className="font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong md:text-4xl">
          Thước phim tuổi thơ
        </h3>
        <p className="hud-label hidden text-faint sm:block">{CHILDHOOD_VIDEOS.length} video</p>
      </div>
      <PointerGlow className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {CHILDHOOD_VIDEOS.map((v, i) => (
          <div key={v.youtube} data-reveal="true">
            <VideoCard video={v} index={i} />
          </div>
        ))}
      </PointerGlow>
    </Section>
  );
}
